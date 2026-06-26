import type { NextConfig } from "next";

// 개발 환경에서 Windows SSL 인증서 체인 문제 우회
// 프로덕션(Vercel)에서는 이 코드가 실행되지 않음
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const nextConfig: NextConfig = {};

export default nextConfig;
