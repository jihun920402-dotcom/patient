# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

병원 환자관리 시스템(Hospital Management System). pnpm + Turborepo 모노레포 구조.

## Commands

```bash
# 전체 개발 서버 (backend :4000, frontend :5173)
pnpm dev

# 개별 실행
pnpm dev:be      # backend only
pnpm dev:fe      # frontend only

# 빌드 / 린트 / 테스트
pnpm build
pnpm lint
pnpm test

# 특정 앱 단독
pnpm --filter backend  <script>
pnpm --filter frontend <script>
```

백엔드는 `tsx watch`로 핫리로드, 프론트엔드는 Vite 개발 서버.  
PostgreSQL 없이 **인메모리 mockDb + JSON 스냅샷**으로 바로 실행 가능하다.

## Architecture

```
apps/
  backend/   Fastify v4 + tsx  (포트 4000)
  frontend/  React 18 + Vite   (포트 5173)
packages/
  shared/    공유 TypeScript 타입 전용 패키지
```

### Shared 패키지 (`packages/shared`)

`@hospital-ms/shared`로 양쪽에서 임포트한다. 타입만 있고 런타임 코드는 없다.  
`src/types/` 아래 도메인별 파일, `src/index.ts`가 전부 재익스포트.  
새 타입 추가 시 여기에 먼저 정의하고 `src/index.ts`에 `export *` 추가.

### Backend (`apps/backend`)

**라우팅**: `src/modules/<domain>/` 마다 `*.routes.ts` + `*.service.ts` 쌍.  
`app.ts`에서 `app.register(xxxRoutes, { prefix: '/api/<domain>' })`로 등록.

**인증/인가**:
- `authenticate` 미들웨어 — `request.jwtVerify()`로 토큰 검증
- `authorize(roles[])` 미들웨어 — `request.user.role`로 역할 체크
- 라우트에서 `preHandler: [authenticate]` 또는 `preHandler: [authenticate, authorize(['DOCTOR'])]`로 사용

**DB (mockDb)**: `src/utils/mockDb.ts`의 인메모리 배열이 테이블 역할.
- `uid()` — UUID 생성
- `nextPatientNo() / nextAppointmentNo() / nextRecordNo() / nextPrescriptionNo() / nextInvoiceNo()` — 도메인별 일련번호
- `saveSnapshot()` — 쓰기 작업 직후 호출해 `apps/backend/data/snapshot.json`에 저장. 서버 시작 시 자동 복원, 30초마다 자동 저장.
- 진단(`recordDiagnoses`)·검사결과(`labResults`)는 MedicalRecord에 임베드되지 않고 **별도 배열**에 저장 후 서비스에서 조립된다.
- Prisma 스키마(`prisma/schema.prisma`)는 PostgreSQL 전환 대비용이며 현재 미사용.

**에러 처리**: `Errors.NotFound / Unauthorized / Forbidden / BadRequest / Conflict` 팩토리 → `AppError(statusCode, message)`.  
라우트 핸들러에서 `catch (err) { if (err instanceof AppError) reply.status(err.statusCode).send(...)` 패턴으로 처리.

**SSN 암호화**: `src/utils/crypto.ts` — AES-256-CBC. `ENCRYPTION_KEY` 환경변수 미설정 시 개발용 기본키 사용.

**Swagger**: `http://localhost:4000/docs`. 라우트 스키마의 `tags / summary / security` 가 자동 반영.

### Frontend (`apps/frontend`)

**상태 관리**:
- `useAuthStore` (Zustand + localStorage persist) — accessToken, refreshToken, user 보관. 키: `hms-auth`
- `useUIStore` (Zustand) — 사이드바 접힘 상태

**서버 상태**: TanStack Query — staleTime 1분, 윈도우 포커스 재요청 비활성.

**API 클라이언트** (`src/services/api.ts`): axios 인스턴스. 요청 인터셉터에서 토큰 자동 첨부, 401 시 refresh 후 원래 요청 재시도. 페이지/컴포넌트에서 axios를 직접 호출하지 않고 `src/services/<domain>Service.ts`를 통해서만 호출.

**라우팅**: `react-router-dom` v6, `src/router.tsx` 집중 관리.  
`AuthGuard` → 미인증 접근을 `/login`으로 리다이렉트.

**UI**: Radix UI + Tailwind CSS + shadcn/ui 패턴 (`src/components/ui/`).

**API 프록시**: `VITE_API_URL` 미설정 시 `/api` 요청 → Vite proxy → `localhost:4000`.

## Auth Flow

1. `POST /api/auth/login` → `accessToken`(15분) + `refreshToken`(7일)
2. Zustand에 저장(localStorage persist)
3. 모든 요청 헤더에 `Authorization: Bearer <accessToken>` 자동 첨부
4. 401 응답 시 `POST /api/auth/refresh`로 재발급 후 원래 요청 재시도
5. 재발급 실패 → logout + `/login` 리다이렉트

## Adding a New Domain Module

1. **타입**: `packages/shared/src/types/<domain>.types.ts` 작성 → `src/index.ts`에 `export *`
2. **Backend**: `src/modules/<domain>/<domain>.service.ts` + `<domain>.routes.ts` 생성 → `app.ts`에 `register` 추가. 쓰기 작업마다 `saveSnapshot()` 호출.
3. **Frontend**: `src/services/<domain>Service.ts` 추가 → 페이지에서 TanStack Query로 호출

## mockDb 샘플 데이터 초기화

`apps/backend/data/snapshot.json`을 삭제하면 mockDb.ts에 하드코딩된 초기 샘플 데이터로 복원된다.

## Dev Accounts

| 역할 | 이메일 | 비밀번호 |
|------|--------|---------|
| ADMIN | admin@hospital.com | admin1234! |
| DOCTOR (내과) | kim@hospital.com | doctor1234! |
| DOCTOR (외과) | lee@hospital.com | doctor1234! |
| DOCTOR (소아과) | choi@hospital.com | doctor1234! |
| DOCTOR (정형외과) | park@hospital.com | doctor1234! |
| DOCTOR (신경과) | shin@hospital.com | doctor1234! |
| NURSE | nurse@hospital.com | nurse1234! |
| RECEPTIONIST | reception@hospital.com | recep1234! |
| PHARMACIST | pharm@hospital.com | pharm1234! |
