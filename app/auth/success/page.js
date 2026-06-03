'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthSuccess() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userEncoded = searchParams.get('user');

    if (token && userEncoded) {
      const user = decodeURIComponent(userEncoded);
      localStorage.setItem('maijiai_token', token);
      localStorage.setItem('maijiai_user', user);
      window.location.href = '/';
    } else {
      window.location.href = '/?error=missing_data';
    }
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{
          width: 50, height: 50,
          border: '3px solid rgba(255,255,255,0.3)',
          borderRadius: '50%', borderTopColor: 'white',
          animation: 'spin 1s ease-in-out infinite',
          margin: '0 auto 20px'
        }} />
        <p style={{ fontSize: 18 }}>登录成功，正在跳转...</p>
      </div>
      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
