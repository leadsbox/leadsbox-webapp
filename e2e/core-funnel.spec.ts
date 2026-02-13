import { expect, test, type Page, type Route } from '@playwright/test';

type MockLead = {
  id: string;
  organizationId: string;
  conversationId?: string;
  providerId?: string;
  provider?: string;
  label?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
};

type MockSale = {
  id: string;
  organizationId: string;
  leadId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID';
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  isAutoDetected: boolean;
  createdAt: string;
  updatedAt: string;
};

type MockState = {
  leads: MockLead[];
  sales: MockSale[];
  followUps: Array<Record<string, unknown>>;
  leadCreatePayloads: Array<Record<string, unknown>>;
  followUpPayloads: Array<Record<string, unknown>>;
  quickCapturePayloads: Array<Record<string, unknown>>;
};

const ORG_ID = 'org_1';
const USER_ID = 'user_1';
const NOW = '2026-02-13T10:00:00.000Z';
const API_PATH_PREFIXES = ['/auth', '/billing', '/orgs', '/threads', '/templates', '/leads', '/followups', '/sales', '/provider', '/integrations', '/analytics'];

const mockUser = {
  id: USER_ID,
  username: 'founder',
  email: 'founder@acme.example',
  role: 'OWNER',
  orgId: ORG_ID,
  currentOrgId: ORG_ID,
  organizations: [{ id: ORG_ID, name: 'Acme Org', role: 'OWNER' }],
  emailVerified: true,
  createdAt: '2026-01-20T10:00:00.000Z',
};

const createMockState = (): MockState => ({
  leads: [],
  sales: [],
  followUps: [],
  leadCreatePayloads: [],
  followUpPayloads: [],
  quickCapturePayloads: [],
});

const toDateTimeLocal = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const json = async (route: Route, payload: unknown, status = 200) => {
  const origin = route.request().headerValue('origin') || '*';
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'access-control-allow-headers': 'Authorization, Content-Type, x-org-id, x-request-id, x-correlation-id',
      vary: 'Origin',
    },
    body: JSON.stringify(payload),
  });
};

const extractApiPath = (urlString: string): string => {
  const url = new URL(urlString);
  const index = url.pathname.indexOf('/api/');
  if (index === -1) return url.pathname;
  return url.pathname.slice(index + 4);
};

const safeBody = (route: Route): Record<string, unknown> => {
  try {
    return (route.request().postDataJSON() || {}) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const installApiMocks = async (page: Page, state: MockState) => {
  await page.route(
    (url) => {
      const pathname = url.pathname;
      const normalized = pathname.startsWith('/api/') ? pathname.slice(4) : pathname;
      return API_PATH_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
    },
    async (route) => {
    const request = route.request();
    const method = request.method();
    const path = extractApiPath(request.url());

    if (method === 'OPTIONS') {
      const origin = route.request().headerValue('origin') || '*';
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': origin,
          'access-control-allow-credentials': 'true',
          'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'access-control-allow-headers': 'Authorization, Content-Type, x-org-id, x-request-id, x-correlation-id',
          vary: 'Origin',
        },
      });
      return;
    }

    if (method === 'GET' && path === '/auth/me') {
      return json(route, {
        user: mockUser,
        accessToken: 'test-access-token',
        data: {
          user: mockUser,
          accessToken: 'test-access-token',
        },
      });
    }

    if (method === 'POST' && path === '/auth/login') {
      return json(route, {
        profile: mockUser,
        token: 'test-access-token',
        data: {
          profile: mockUser,
          token: 'test-access-token',
        },
      });
    }

    if (method === 'GET' && path === '/billing/subscription') {
      return json(route, { data: { subscription: null, trialDaysRemaining: 14, trialEndsAt: '2026-02-27T10:00:00.000Z' } });
    }

    if (method === 'GET' && path === '/orgs') {
      return json(route, { data: { orgs: [{ id: ORG_ID, name: 'Acme Org', role: 'OWNER' }] } });
    }

    if (method === 'GET' && /^\/orgs\/[^/]+\/members$/.test(path)) {
      return json(route, {
        data: {
          members: [
            {
              id: 'member_1',
              organizationId: ORG_ID,
              userId: USER_ID,
              role: 'OWNER',
              addedAt: NOW,
              user: {
                id: USER_ID,
                email: 'founder@acme.example',
                firstName: 'Acme',
                lastName: 'Founder',
                username: 'founder',
                profileImage: null,
              },
            },
          ],
        },
      });
    }

    if (method === 'GET' && /^\/orgs\/[^/]+$/.test(path)) {
      return json(route, { data: { organization: { id: ORG_ID, name: 'Acme Org' } } });
    }

    if (method === 'GET' && path === '/threads/unread-count') {
      return json(route, { data: { count: 0 } });
    }

    if (method === 'GET' && path === '/threads') {
      return json(route, {
        data: {
          threads: [
            {
              id: 'thread_1',
              organizationId: ORG_ID,
              contact: {
                id: 'contact_1',
                organizationId: ORG_ID,
                displayName: 'Acme Buyer',
                phone: '+15550001111',
                waId: '15550001111',
                email: null,
                createdAt: NOW,
                updatedAt: NOW,
              },
              channel: { id: 'channel_1', type: 'WHATSAPP', displayName: 'WhatsApp' },
              Lead: [],
              status: 'OPEN',
              lastMessageAt: NOW,
            },
          ],
        },
      });
    }

    if (method === 'GET' && /^\/threads\/[^/]+\/messages$/.test(path)) {
      return json(route, {
        data: {
          messages: [
            {
              id: 'msg_1',
              threadId: 'thread_1',
              channelType: 'WHATSAPP',
              direction: 'IN',
              text: 'Can I get pricing?',
              sentAt: NOW,
            },
          ],
        },
      });
    }

    if (method === 'POST' && /^\/threads\/[^/]+\/mark-read$/.test(path)) {
      return json(route, { data: { success: true } });
    }

    if (method === 'GET' && path === '/templates') {
      return json(route, { data: [] });
    }

    if (method === 'GET' && path === '/leads') {
      return json(route, { data: { leads: state.leads } });
    }

    if (method === 'POST' && path === '/leads') {
      const payload = safeBody(route);
      state.leadCreatePayloads.push(payload);
      const leadId = `lead_auto_${state.leadCreatePayloads.length}`;
      const timestamp = new Date().toISOString();
      const lead: MockLead = {
        id: leadId,
        organizationId: String(payload.organizationId || ORG_ID),
        conversationId: String(payload.conversationId || ''),
        providerId: String(payload.providerId || ''),
        provider: String(payload.provider || 'whatsapp'),
        label: String(payload.label || 'NEW_LEAD'),
        createdAt: timestamp,
        updatedAt: timestamp,
        lastMessageAt: timestamp,
      };
      state.leads.push(lead);
      return json(route, { data: { id: leadId } }, 201);
    }

    if (method === 'PUT' && /^\/leads\/[^/]+$/.test(path)) {
      const payload = safeBody(route);
      const leadId = path.split('/')[2];
      state.leads = state.leads.map((lead) => (lead.id === leadId ? { ...lead, label: String(payload.label || lead.label), updatedAt: new Date().toISOString() } : lead));
      return json(route, { data: { id: leadId } });
    }

    if (method === 'GET' && path === '/followups') {
      return json(route, { data: { followUps: state.followUps } });
    }

    if (method === 'POST' && path === '/followups') {
      const payload = safeBody(route);
      state.followUpPayloads.push(payload);
      state.followUps.push({
        id: `followup_${state.followUps.length + 1}`,
        ...payload,
        status: 'SCHEDULED',
      });
      return json(route, { data: { id: `followup_${state.followUps.length}` } }, 201);
    }

    if (method === 'GET' && path === '/sales/review/inbox') {
      return json(route, {
        data: {
          sales: [],
          summary: {
            pendingCount: 0,
            highRiskCount: 0,
            averageConfidence: 0,
          },
        },
      });
    }

    if (method === 'GET' && path === '/sales') {
      return json(route, { data: { sales: state.sales } });
    }

    if (method === 'POST' && path === '/sales/quick-capture') {
      const payload = safeBody(route);
      state.quickCapturePayloads.push(payload);
      const now = new Date().toISOString();
      const sale: MockSale = {
        id: `sale_${state.quickCapturePayloads.length}`,
        organizationId: ORG_ID,
        leadId: String(payload.leadId || ''),
        amount: Number(payload.amount || 0),
        currency: String(payload.currency || 'NGN'),
        status: payload.status === 'PENDING' ? 'PENDING' : 'PAID',
        items: [],
        isAutoDetected: false,
        createdAt: now,
        updatedAt: now,
      };
      state.sales.push(sale);
      return json(route, { data: { sale } }, 201);
    }

    if (method === 'GET' && path === '/provider/whatsapp/status') {
      return json(route, { data: { connected: true } });
    }

    if (method === 'GET' && path === '/integrations/whatsapp/status') {
      return json(route, { data: { connected: true } });
    }

    if (method === 'GET' && path === '/provider/instagram/status') {
      return json(route, { data: { connected: false } });
    }

    if (method === 'GET' && path === '/analytics/overview') {
      return json(route, { data: { overview: {} } });
    }

    if (method === 'GET' && path === '/analytics/pmf-weekly') {
      return json(route, {
        data: {
          report: {
            generatedAt: NOW,
            days: 7,
            totals: {
              membersAdded: 0,
              leadsCreated: state.leads.length,
              paidSales: state.sales.filter((sale) => sale.status === 'PAID').length,
            },
          },
        },
      });
    }

    if (method === 'POST' && path === '/analytics/events') {
      return json(route, { data: { accepted: true } }, 201);
    }

      return json(route, { data: {} });
    },
  );
};

const runCoreFunnelFlow = async (page: Page, state: MockState) => {
  const seedAuthStorage = async () => {
    await page.evaluate(
      ({ user, orgId }) => {
        window.localStorage.setItem('lb_access_token', 'test-access-token');
        window.localStorage.setItem('lb_org_id', orgId);
        window.localStorage.setItem('lb_user', JSON.stringify(user));
      },
      { user: mockUser, orgId: ORG_ID },
    );
  };

  const setupHeading = page.getByRole('heading', { name: 'Launch Setup Wizard' });

  await page.goto('/dashboard/setup');

  const setupVisible = await setupHeading
    .waitFor({ state: 'visible', timeout: 4_000 })
    .then(() => true)
    .catch(() => false);

  if (!setupVisible) {
    const loginHeading = page.getByRole('heading', { name: 'Welcome back!' });
    const onLoginPage = await loginHeading
      .waitFor({ state: 'visible', timeout: 2_000 })
      .then(() => true)
      .catch(() => false);

    if (!onLoginPage) {
      await page.goto('/login');
      await expect(loginHeading).toBeVisible({ timeout: 10_000 });
    }

    await page.getByPlaceholder('Email').fill('founder@acme.example');
    await page.getByPlaceholder('Password').fill('Passw0rd!123');
    await page.locator('form button[type="submit"]').click();
    await seedAuthStorage();
    await page.goto('/dashboard/setup');
  }

  await expect(setupHeading).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Setup Progress')).toBeVisible({ timeout: 15_000 });

  const inboxLink = page.getByRole('link', { name: 'Inbox' }).first();
  const hasInboxLink = await inboxLink.isVisible().catch(() => false);
  if (hasInboxLink) {
    await inboxLink.click();
  } else {
    await seedAuthStorage();
    await page.goto('/dashboard/inbox');
  }
  const scheduleActionButton = page.getByRole('button', { name: 'Schedule follow-up' }).first();
  await expect(scheduleActionButton).toBeVisible({ timeout: 15_000 });
  await scheduleActionButton.click();

  const scheduleDialog = page.getByRole('dialog', { name: 'Schedule follow-up' });
  await expect(scheduleDialog).toBeVisible();

  const scheduledAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
  await scheduleDialog.locator('input[type="datetime-local"]').fill(toDateTimeLocal(scheduledAt));
  await scheduleDialog.locator('textarea[placeholder="Type your follow-up message"]').fill('Checking in on your order status.');
  await scheduleDialog.getByRole('button', { name: 'Schedule follow-up' }).click();
  await expect(scheduleDialog).toBeHidden();

  await expect.poll(() => state.leadCreatePayloads.length).toBe(1);
  await expect.poll(() => state.followUpPayloads.length).toBe(1);

  await page.getByRole('button', { name: 'Mark paid' }).click();
  await expect(page).toHaveURL(/\/dashboard\/sales/);

  const quickCaptureDialog = page.getByRole('dialog', { name: 'Quick capture sale' });
  await expect(quickCaptureDialog).toBeVisible();
  await quickCaptureDialog.locator('input[placeholder="0.00"]').fill('25000');

  const savePaidButton = quickCaptureDialog.getByRole('button', { name: 'Save as paid' });
  await expect(savePaidButton).toBeEnabled();
  await savePaidButton.click();

  await expect.poll(() => state.quickCapturePayloads.length).toBe(1);
  expect(state.quickCapturePayloads[0]).toMatchObject({
    leadId: 'lead_auto_1',
    status: 'PAID',
    amount: 25000,
  });
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ user, orgId }) => {
      window.localStorage.setItem('lb_access_token', 'test-access-token');
      window.localStorage.setItem('lb_org_id', orgId);
      window.localStorage.setItem('lb_user', JSON.stringify(user));
    },
    { user: mockUser, orgId: ORG_ID },
  );
});

test('core funnel desktop: setup, follow-up scheduling, and paid quick capture', async ({ page }) => {
  const state = createMockState();
  await installApiMocks(page, state);
  await runCoreFunnelFlow(page, state);
});
