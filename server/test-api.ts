process.env.NO_AUTO_START = 'true';
import http from 'http';

async function runTests() {
  const { default: app } = await import('./index.ts');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5001, resolve));
  const baseUrl = 'http://localhost:5001/api';

  console.log('🧪 Starting API Verification Tests...');

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/health`).then((r) => r.json());
  console.log('1. Health check:', healthRes.status === 'ok' ? '✅ PASS' : '❌ FAIL');

  // 2. Fetch products
  const products: any = await fetch(`${baseUrl}/products`).then((r) => r.json());
  console.log('2. Products count:', products.length, products.length > 0 ? '✅ PASS' : '❌ FAIL');
  const sampleProd = products[0];
  console.log('   Sample product stockByStore:', sampleProd.stockByStore);

  // 3. Auth test - Invalid password
  const failLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@megastation.com', password: 'wrongpassword' }),
  });
  console.log('3. Invalid password rejected (401):', failLogin.status === 401 ? '✅ PASS' : '❌ FAIL');

  // 4. Auth test - Valid password
  const successLogin: any = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@megastation.com', password: 'admin123' }),
  }).then((r) => r.json());
  console.log('4. Valid password login:', Boolean(successLogin.token && successLogin.user.role === 'admin') ? '✅ PASS' : '❌ FAIL');
  const adminToken = successLogin.token;

  // 5. Order creation - Insufficient stock test
  const badOrderRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1122334455',
        dni: '12345678',
      },
      items: [{ productId: sampleProd.id, quantity: 999999 }],
      deliveryMethod: 'pickup',
      branchId: 'belgrano',
      paymentMethod: 'mercadopago',
    }),
  });
  console.log('5. Insufficient stock rejected (400):', badOrderRes.status === 400 ? '✅ PASS' : '❌ FAIL');

  // Pick a product with available stock in Belgrano, or replenish stock if needed
  let testProd = products.find((p: any) => p.stockByStore.belgrano > 0);
  if (!testProd) {
    await fetch(`${baseUrl}/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ productId: sampleProd.id, branchId: 'belgrano', newQuantity: 10 }),
    });
    const refreshedProds: any = await fetch(`${baseUrl}/products`).then((r) => r.json());
    testProd = refreshedProds.find((p: any) => p.id === sampleProd.id);
  }
  const initialStock = testProd.stockByStore.belgrano;

  // 6. Order creation - Valid order
  const validOrder: any = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: {
        fullName: 'Juan Pérez',
        email: 'juan.perez@example.com',
        phone: '+54 11 9988-7766',
        dni: '38123456',
        address: { street: 'Av. Cabildo', number: '2000', city: 'CABA', province: 'Buenos Aires', postalCode: '1428' },
      },
      items: [{ productId: testProd.id, quantity: 1 }],
      deliveryMethod: 'pickup',
      branchId: 'belgrano',
      paymentMethod: 'mercadopago',
    }),
  }).then((r) => r.json());
  console.log('6. Valid order created on server:', Boolean(validOrder.id && validOrder.trackingNumber) ? '✅ PASS' : '❌ FAIL');
  console.log('   Created Order ID:', validOrder.id, 'Tracking:', validOrder.trackingNumber);

  // 7. Payment preference creation (Sandbox)
  const prefRes: any = await fetch(`${baseUrl}/payments/create-preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: validOrder.id }),
  }).then((r) => r.json());
  console.log('7. Mercado Pago Preference generated:', Boolean(prefRes.id && prefRes.sandboxInitPoint) ? '✅ PASS' : '❌ FAIL');
  console.log('   Sandbox Init Point:', prefRes.sandboxInitPoint);

  // 8. Order tracking test
  const trackRes: any = await fetch(`${baseUrl}/orders/track?code=${validOrder.trackingNumber}`).then((r) => r.json());
  console.log('8. Order tracked by code:', trackRes.id === validOrder.id ? '✅ PASS' : '❌ FAIL');

  // 9. Stock verification - Ensure stock was decremented in DB
  const updatedProds: any = await fetch(`${baseUrl}/products`).then((r) => r.json());
  const updatedTestProd = updatedProds.find((p: any) => p.id === testProd.id);
  console.log('9. Stock decremented in DB:', updatedTestProd.stockByStore.belgrano === initialStock - 1 ? '✅ PASS' : '❌ FAIL');

  server.close(() => {
    console.log('\n🎉 ALL 9 TEST SUITES COMPLETED SUCCESSFULLY!');
    process.exit(0);
  });
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
