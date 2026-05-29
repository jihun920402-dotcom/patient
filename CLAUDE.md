# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

병원 환자관리 시스템(Hospital Management System). pnpm + Turborepo 모노레포 구조로 프론트엔드·백엔드·공유 패키지로 나뉜다.

## Commands

```bash
# 전체 개발 서버 (backend :4000, frontend :5173)
pnpm dev

# 개별 실행
pnpm dev:be      # backend only
pnpm dev:fe      # frontend only

# 빌드
pnpm build

# 린트
pnpm lint

# 테스트 (전체)
pnpm test

# 특정 앱 단독 명령
pnpm --filter backend  <script>
pnpm --filter frontend <script>
```

백엔드는 `tsx watch`로 핫리로드되고, 프론트엔드는 Vite 개발 서버.  
PostgreSQL 없이 **인메모리 mockDb**로 바로 실행 가능하다.

## Architecture

```
apps/
  backend/   Fastify + tsx (포트 4000)
  frontend/  React 18 + Vite (포트 5173)
packages/
  shared/    공유 TypeScript 타입 전용 패키지
```

### Shared 패키지 (`packages/shared`)

`@hospital-ms/shared`로 양쪽에서 임포트한다. 타입만 있고 런타임 코드는 없다.  
`src/types/` 아래에 도메인별 파일이 있으며 `src/index.ts`가 전부 재익스포트한다.  
새 타입 추가 시 반드시 여기에 먼저 정의한다.

### Backend (`apps/backend`)

- **프레임워크**: Fastify v4
- **인증**: `@fastify/jwt` — `authenticate` 미들웨어가 `request.jwtVerify()`로 검증, `authorize(roles[])` 미들웨어가 역할을 체크한다.
- **라우팅 구조**: `src/modules/<domain>/` 디렉터리마다 `*.routes.ts`(라우트 정의) + `*.service.ts`(비즈니스 로직) 쌍으로 구성된다. `app.ts`에서 prefix `/api/<domain>`으로 등록.
- **DB**: `src/utils/mockDb.ts`에 인메모리 배열 + `uid()` / `nextXxxNo()` 헬퍼. Prisma 스키마(`prisma/schema.prisma`)는 PostgreSQL 마이그레이션을 위해 준비되어 있으나 현재 미사용.
- **에러 처리**: `AppError(statusCode, message)` + `Errors.*` 팩토리(`src/utils/errors.ts`). 각 라우트 핸들러에서 `instanceof AppError`를 catch해 상태 코드를 그대로 반환.
- **Swagger**: `/docs` 경로에서 확인 가능. 각 라우트의 `schema.tags / summary / security`가 자동 반영된다.

### Frontend (`apps/frontend`)

- **상태**: Zustand `useAuthStore` (localStorage에 persist) — 액세스 토큰, 리프레시 토큰, 유저 정보 보관.
- **서버 상태**: TanStack Query (`src/lib/queryClient.ts`) — staleTime 1분, 윈도우 포커스 재요청 비활성.
- **API 클라이언트**: `src/services/api.ts` — axios 인스턴스. 요청 인터셉터에서 토큰 자동 첨부, 응답 인터셉터에서 401 시 리프레시 토큰으로 자동 재발급.
- **서비스 레이어**: `src/services/<domain>Service.ts` — api 인스턴스를 감싸는 얇은 함수들. 페이지/컴포넌트에서 직접 axios를 호출하지 않는다.
- **라우팅**: `react-router-dom` v6, `src/router.tsx`에 집중 관리. `AuthGuard`가 미인증 접근을 `/login`으로 리다이렉트.
- **UI**: Radix UI + Tailwind CSS + shadcn/ui 패턴 (`src/components/ui/`).
- **API 프록시**: `VITE_API_URL` 미설정 시 `/api`로 요청 → Vite의 proxy 설정으로 `localhost:4000`에 전달.

## Auth Flow

1. 로그인 → `POST /api/auth/login` → `accessToken`(15분) + `refreshToken`(7일) 반환
2. Zustand에 저장(localStorage persist)
3. 모든 API 요청 헤더에 `Authorization: Bearer <accessToken>` 자동 첨부
4. 401 응답 시 `POST /api/auth/refresh`로 재발급 후 원래 요청 재시도
5. 재발급 실패 → logout + `/login` 리다이렉트

## Adding a New Domain Module

**Backend**: `src/modules/<domain>/` 아래 `<domain>.service.ts` + `<domain>.routes.ts` 생성 → `app.ts`에 `register` 추가.  
**Frontend**: `src/services/<domain>Service.ts` 추가 → 페이지에서 TanStack Query로 호출.  
**타입**: `packages/shared/src/types/<domain>.types.ts` 추가 후 `src/index.ts`에 `export *` 추가.

## Dev Accounts

| 역할 | 이메일 | 비밀번호 |
|------|--------|---------|
| ADMIN | admin@hospital.com | admin1234! |
| DOCTOR | kim@hospital.com | doctor1234! |
| DOCTOR | lee@hospital.com | doctor1234! |
| NURSE | nurse@hospital.com | nurse1234! |
| RECEPTIONIST | reception@hospital.com | recep1234! |
| PHARMACIST | pharm@hospital.com | pharm1234! |
