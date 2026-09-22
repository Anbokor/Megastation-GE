import { Router, Request, Response } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { db } from '../db/index.ts';
import { orders, orderItems } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export const paymentsRouter = Router();

// Test credentials / Sandbox token fallback
const MP_ACCESS_TOKEN =
  process.env.MERCADO_PAGO_ACCESS_TOKEN ||
  'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000';

const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
  options: { timeout: 7000 },
});

// POST /api/payments/create-preference
paymentsRouter.post('/create-preference', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ error: 'orderId es requerido para generar preferencia de pago.' });
      return;
    }

    const order = db.select().from(orders).where(eq(orders.id, orderId)).get();
    if (!order) {
      res.status(404).json({ error: 'Orden no encontrada.' });
      return;
    }

    const items = db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).all();

    // Prepare items for Mercado Pago Preference
    const mpItems = items.map((i) => ({
      id: i.productId,
      title: i.productName,
      unit_price: Number(i.price),
      quantity: Number(i.quantity),
      currency_id: 'ARS',
    }));

    if (order.shippingCost > 0) {
      mpItems.push({
        id: 'shipping-delivery',
        title: 'Costo de Envío a Domicilio',
        unit_price: Number(order.shippingCost),
        quantity: 1,
        currency_id: 'ARS',
      });
    }

    try {
      const preference = new Preference(mpClient);
      const appUrl = process.env.APP_URL || 'http://localhost:3000';

      const prefResponse = await preference.create({
        body: {
          items: mpItems,
          payer: {
            name: order.customerName,
            email: order.customerEmail,
          },
          external_reference: order.id,
          back_urls: {
            success: `${appUrl}/?status=success&orderId=${order.id}`,
            failure: `${appUrl}/?status=failure&orderId=${order.id}`,
            pending: `${appUrl}/?status=pending&orderId=${order.id}`,
          },
          auto_return: 'approved',
          statement_descriptor: 'MEGASTATION',
        },
      });

      res.json({
        id: prefResponse.id,
        initPoint: prefResponse.init_point,
        sandboxInitPoint: prefResponse.sandbox_init_point,
        mode: 'live_preference',
      });
    } catch (mpError: any) {
      // In development / test sandbox if mock token is used, return mock sandbox preference
      console.warn('MercadoPago API returned error, providing simulated sandbox checkout:', mpError?.message);
      const simulatedPrefId = `TEST-PREF-${order.id}-${Date.now()}`;
      res.json({
        id: simulatedPrefId,
        initPoint: `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${simulatedPrefId}`,
        sandboxInitPoint: `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${simulatedPrefId}`,
        mode: 'simulated_sandbox',
        notice: 'Modo Sandbox activo. Configura MERCADO_PAGO_ACCESS_TOKEN para producción.',
      });
    }
  } catch (error) {
    console.error('Error in create-preference:', error);
    res.status(500).json({ error: 'Error al generar preferencia de Mercado Pago.' });
  }
});

// POST /api/webhooks/mercadopago
paymentsRouter.post('/webhooks/mercadopago', async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, type, data } = req.body;
    console.log('🔔 Mercado Pago Webhook received:', { action, type, data });

    // Handle payment approval
    const orderId = req.query?.orderId as string | undefined || data?.external_reference;
    if (orderId) {
      const existing = db.select().from(orders).where(eq(orders.id, orderId)).get();
      if (existing) {
        let history = [];
        try {
          history = JSON.parse(existing.statusHistoryJson || '[]');
        } catch {}

        history.push({
          status: 'en_preparacion',
          timestamp: new Date().toISOString(),
          note: 'Pago acreditado mediante webhook de Mercado Pago.',
        });

        db.update(orders)
          .set({
            paymentStatus: 'paid',
            orderStatus: 'en_preparacion',
            statusHistoryJson: JSON.stringify(history),
          })
          .where(eq(orders.id, orderId))
          .run();
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Error al procesar webhook.' });
  }
});
