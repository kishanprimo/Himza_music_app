import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import axios from "axios";
import { response_service } from "../services";
import { config } from "../config";

const clientId = config.PAYPAL_CLIENT_ID;
const clientSecret = config.PAYPAL_CLIENT_SECRET;

// Base URL for Sandbox
const PAYPAL_API = config.PAYPAL_API;



// Step 1 – Get Access Token
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await axios({
    url: `${PAYPAL_API}/v1/oauth2/token`,
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    data: "grant_type=client_credentials",
  });

  return response.data.access_token;
}

// Step 2 – Create Paypal Order
// async function createOrder(amount: number) {
//   try {
//     const accessToken = await getAccessToken();

//     const orderData = {
//       intent: "CAPTURE",
//       purchase_units: [
//         {
//           amount: {
//             currency_code: "USD",
//             value: amount,
//           },
//         },
//       ],
//     };

//     const response = await axios({
//       url: `${PAYPAL_API}/v2/checkout/orders`,
//       method: "post",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${accessToken}`,
//       },
//       data: orderData,
//     });
//     return response.data;
//   } catch (error: any) {
//     console.error("PayPal API error:", error.response?.data || error.message);
//     throw error;
//   }
// }
async function createOrder(amount: number) {
  try {
    const accessToken = await getAccessToken();

    const response = await axios({
      url: `${PAYPAL_API}/v2/checkout/orders`,
      
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount.toString(),
            },
          },
        ],
      },
    });

    return response.data;

  } catch (error: any) {
    throw new Error(error.response?.data?.error_description || "PayPal failed");
  }
}

export default createOrder;
