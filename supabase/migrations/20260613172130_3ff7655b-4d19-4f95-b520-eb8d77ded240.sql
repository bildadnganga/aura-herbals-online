
CREATE TABLE public.mpesa_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  phone text NOT NULL,
  amount numeric NOT NULL,
  checkout_request_id text UNIQUE,
  merchant_request_id text,
  mpesa_receipt text,
  status text NOT NULL DEFAULT 'pending',
  result_code integer,
  result_desc text,
  raw_callback jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mpesa_payments TO authenticated;
GRANT ALL ON public.mpesa_payments TO service_role;

ALTER TABLE public.mpesa_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments" ON public.mpesa_payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER mpesa_payments_touch
  BEFORE UPDATE ON public.mpesa_payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_mpesa_payments_order ON public.mpesa_payments(order_id);
CREATE INDEX idx_mpesa_payments_checkout ON public.mpesa_payments(checkout_request_id);
