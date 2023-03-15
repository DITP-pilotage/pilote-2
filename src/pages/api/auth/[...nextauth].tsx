import handleNextAuth from '@/server/infrastructure/api/auth/[...nextauth]';

export default function handle(...args: any[]) {
  return handleNextAuth(...args);
}
