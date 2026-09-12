class PaymentDto {
  static validateVerifyJDPack(data) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      const err = new Error('Missing payment fields.'); err.status = 400; throw err;
    }
    return { razorpay_order_id, razorpay_payment_id, razorpay_signature };
  }

  static validateCreatePlacement(data) {
    const { planId } = data;
    if (!planId) {
      const err = new Error('planId is required.'); err.status = 400; throw err;
    }
    return { planId };
  }

  static validateVerifyPlacement(data) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = data;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      const err = new Error('Missing payment fields.'); err.status = 400; throw err;
    }
    return { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId };
  }
}

module.exports = PaymentDto;
