import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const Stripe = new stripe(process.env.STRIPE_SECRET_KEY);
console.log("stripe object", Stripe);
// placing userOrder form frontend
const placeOrder = async (req, res) => {
  const { userId, items, amount, address } = req.body;
  const frontendURL = "http://localhost:5173";
  try {
    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    const line_items = items.map((item) => ({
      price_data: {
        currency: "aed",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100 * 3.67,
      },
      quantity: item.quantity,
    }));
    line_items.push({
      price_data: {
        currency: "aed",
        product_data: {
          name: "Delievery Charges",
        },
        unit_amount: 10 * 100 * 3.67,
      },
      quantity: 1,
    });

    const session = await Stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${frontendURL}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontendURL}/verify?success=false&orderId=${newOrder._id}`,
    });
    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Something went wrong!" });
  }
};

const verifyOrder = async (req, res) => {};
export { placeOrder, verifyOrder };