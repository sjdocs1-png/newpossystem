export interface NormalizedCustomerReference {
  customer_id: string | null;
  customer_phone: string | null;
  customer_name: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PHONE_REGEX = /^[+]?[0-9]{6,20}$/;

export function normalizeCustomerReference(input: {
  customerId?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
}): NormalizedCustomerReference {
  const rawId = String(input.customerId ?? '').trim();
  const rawPhone = String(input.customerPhone ?? '').trim();
  const rawName = String(input.customerName ?? '').trim();

  const customer_id = UUID_REGEX.test(rawId) ? rawId : null;
  const customer_phone = customer_id
    ? (PHONE_REGEX.test(rawPhone) ? rawPhone : null)
    : PHONE_REGEX.test(rawId)
      ? rawId
      : (PHONE_REGEX.test(rawPhone) ? rawPhone : null);
  const customer_name = rawName || customer_phone || null;

  return {
    customer_id,
    customer_phone,
    customer_name,
  };
}
