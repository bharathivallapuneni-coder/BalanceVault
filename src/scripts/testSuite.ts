import http from 'http';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000/api';

function request(path: string, options: any = {}, body: any = null): Promise<{ status: number; data: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqOptions: http.RequestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token && { Authorization: `Bearer ${options.token}` }),
        ...options.headers,
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = raw ? JSON.parse(raw) : {};
        } catch {
          parsed = raw;
        }
        resolve({ status: res.statusCode || 500, data: parsed, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

export async function runIntegrationTests() {
  console.log('====================================================');
  console.log('BalanceVault System Integration & Security Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, title: string) => {
    if (condition) {
      console.log(`\x1b[32m✔ PASS:\x1b[0m ${title}`);
      passed++;
    } else {
      console.error(`\x1b[31m✖ FAIL:\x1b[0m ${title}`);
      failed++;
    }
  };

  try {
    // 1. Health & Readiness
    const healthRes = await request('/health');
    assert(healthRes.status === 200 && healthRes.data.status === 'UP', 'GET /api/health reports UP');

    const readyRes = await request('/ready');
    assert(readyRes.status === 200 && readyRes.data.status === 'READY', 'GET /api/ready reports READY with active database & rate limiter');

    // 2. Account Holder Registration
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regPayload = {
      fullName: 'Integration Test User',
      email: testEmail,
      phone: '+1 (555) 019-9921',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      residentialAddress: '888 Enterprise Way, Suite 100',
      dateOfBirth: '1992-06-20',
    };

    const regRes = await request('/auth/register', { method: 'POST' }, regPayload);
    assert(regRes.status === 201 && regRes.data.user?.role === 'ACCOUNT_HOLDER', 'User registration assigns ACCOUNT_HOLDER role');

    // Duplicate email check
    const dupRes = await request('/auth/register', { method: 'POST' }, regPayload);
    assert(dupRes.status === 409, 'Duplicate email registration rejected with 409 Conflict');

    // 3. User Login
    const loginRes = await request('/auth/login', { method: 'POST' }, {
      email: testEmail,
      password: 'SecurePassword123!',
    });
    assert(loginRes.status === 200 && !!loginRes.data.token, 'Account holder login successful with JWT issued');
    const userToken = loginRes.data.token;

    // 4. RBAC Check: Account Holder blocked from Admin API
    const rbacRes = await request('/admin/dashboard', { token: userToken });
    assert(rbacRes.status === 403, 'RBAC check: ACCOUNT_HOLDER strictly forbidden (403) from accessing /api/admin/dashboard');

    // 5. User Submits Onboarding
    const onbSubmitRes = await request('/users/onboarding', { method: 'POST', token: userToken }, {
      residentialAddress: '888 Enterprise Way, Suite 100',
      dateOfBirth: '1992-06-20',
      identificationType: 'PASSPORT',
      identificationNumber: 'PASS-78901234',
    });
    assert(onbSubmitRes.status === 200 && onbSubmitRes.data.onboarding?.status === 'PENDING', 'Onboarding submission recorded with status PENDING');

    // 6. Admin Login
    const adminEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@balancevault.internal').toLowerCase().trim();
    const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'VaultAdmin@2026!';
    const adminLoginRes = await request('/auth/login', { method: 'POST' }, {
      email: adminEmail,
      password: adminPassword,
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.user?.role === 'ADMIN', 'Master Admin login successful with verified ADMIN role');
    const adminToken = adminLoginRes.data.token;

    // Admin reviews queue and approves
    const adminQueueRes = await request('/admin/onboarding?status=PENDING', { token: adminToken });
    const targetApp = (adminQueueRes.data.data || []).find((item: any) => item.user?.email === testEmail);
    assert(!!targetApp, 'Admin onboarding queue reflects the pending applicant');

    if (targetApp) {
      const approveRes = await request(`/admin/onboarding/${targetApp.id}/approve`, {
        method: 'PATCH',
        token: adminToken,
      });
      assert(approveRes.status === 200, 'Admin approves onboarding request');

      // Verify Account Activated
      const updatedUserAcc = await request('/users/account', { token: userToken });
      assert(updatedUserAcc.data.account?.status === 'ACTIVE', 'Associated account automatically activated upon onboarding approval');
    }

    // 7. Audit Log Check & Secret Scrubbing
    const auditRes = await request('/admin/audit-logs?search=USER_REGISTERED', { token: adminToken });
    const regLog = (auditRes.data.data || []).find((log: any) => log.actorEmail === testEmail);
    assert(
      regLog && !regLog.metadata?.password && !regLog.metadata?.token,
      'Audit log tracks registration event with sensitive secrets thoroughly scrubbed'
    );

    console.log('\n====================================================');
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');
    return failed === 0;
  } catch (err) {
    console.error('Test execution error:', err);
    return false;
  }
}

if (process.argv[1] && process.argv[1].endsWith('testSuite.ts')) {
  runIntegrationTests().then((success) => process.exit(success ? 0 : 1));
}
