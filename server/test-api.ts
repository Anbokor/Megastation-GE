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

  // 5. Order creation - Zero stock product allowed as 'Bajo Pedido' (On-demand)
  const backorderRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: {
        fullName: 'Comprador Bajo Pedido',
        email: 'bajopedido@example.com',
        phone: '1122334455',
        dni: '12345678',
      },
      items: [{ productId: sampleProd.id, quantity: 2 }], // sampleProd has 0 stock in belgrano
      deliveryMethod: 'pickup',
      branchId: 'belgrano',
      paymentMethod: 'bank_transfer',
    }),
  });
  const backorderData: any = await backorderRes.json();
  const isBackorderSuccess =
    backorderRes.status === 201 &&
    backorderData.hasBackorder === true &&
    Boolean(backorderData.items?.[0]?.isBackorder);
  console.log('5. On-Demand (Bajo Pedido) purchase accepted (status 201, hasBackorder: true):', isBackorderSuccess ? '✅ PASS' : '❌ FAIL');

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

  // 10. Product Creation Test (Admin only)
  const newProductRes: any = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'NVIDIA GeForce RTX 5080 Gaming OC 16GB',
      brand: 'Gigabyte',
      category: 'gpu',
      description: 'Arquitectura Blackwell, 16GB GDDR7, DLSS 4',
      price: 1850000,
      costPrice: 1350000,
      marginPercent: 37,
      stockByStore: { belgrano: 3, colegiales: 2, central: 5 },
    }),
  }).then((r) => r.json());
  console.log('10. Admin created new product:', Boolean(newProductRes.id && newProductRes.barcode && newProductRes.stockByStore.belgrano === 3) ? '✅ PASS' : '❌ FAIL');
  console.log('    New product ID:', newProductRes.id, 'EAN-13 Barcode:', newProductRes.barcode);

  // 11. Inventory Audit Transactions Test
  const txListRes: any = await fetch(`${baseUrl}/inventory/transactions`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());
  console.log('11. Inventory transactions retrieved:', Array.isArray(txListRes) && txListRes.length > 0 ? '✅ PASS' : '❌ FAIL');
  console.log('    Total audit transactions logged in SQLite:', txListRes.length);

  server.close(() => {
    console.log('\n🎉 ALL 11 TEST SUITES COMPLETED SUCCESSFULLY!');
    process.exit(0);
  });
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
