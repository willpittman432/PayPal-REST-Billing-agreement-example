const express = require("express");
const router = express.Router();
const base64 = require("base-64");
const axios = require("axios");
const config = require("../config/config");

let orderHelpers = {};

orderHelpers.getCreds = () => {
  let client_id = config.creds.client_id;
  let client_secret = config.creds.client_secret;
  let stringToEncode = `${client_id}:${client_secret}`;
  let encodedString = base64.encode(stringToEncode);
  return encodedString;
};

orderHelpers.tokenRequest = () => {
  return new Promise(resolve => {
    axios
      .post(
        "https://api.sandbox.paypal.com/v1/oauth2/token",
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${orderHelpers.getCreds()}`
          }
        }
      )
      .then(response => resolve(response.data.access_token))
      .catch(err => console.error(err));
  });
};

orderHelpers.getBaDetails = (accessToken, billingAgreementId, res) => {
  return new Promise(resolve => {
    axios
      .get(
        `https://api.sandbox.paypal.com/v1/billing-agreements/agreements/${billingAgreementId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          }
        }
      )
      .then(response => {
        resolve(res.send({ billingAgreementData: response.data }));
      })
      .catch(e => console.error(e));
  });
};

orderHelpers.createOrder = (access_token, json, res) => {
  return new Promise(resolve => {
    axios
      .post("https://api.sandbox.paypal.com/v2/checkout/orders", json, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`
        }
      })
      .then(response => resolve(response.data.id));
  });
};

orderHelpers.capturePaymentForOrder = (
  access_token,
  orderId,
  capture_json,
  res
) => {
  return new Promise(resolve => {
    axios
      .post(
        `https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
        capture_json,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`
          }
        }
      )
      .then(response => resolve(res.send({ data: response.data })));
  });
};

//ENDPOINTS

//GET Render Page
router.get("/", (req, res) => {
  res.render("paypalBAOrders");
});

/**POST
 * on page load, get billing agreement details
 */
router.post("/get_ba_details", (req, res) => {
  let baID = req.body.ba_Id;

  let getBaDetails = async () => {
    try {
      const token = await orderHelpers.tokenRequest();
      const baDetails = await orderHelpers.getBaDetails(token, baID, res);
      return baDetails;
    } catch (e) {
      console.error(e);
    }
  };
  getBaDetails();
});

/**
 * POST
 * Create PayPal Order and Capture
 */
router.post("/initOrderFlow", (req, res) => {
  console.log("reached init order");
  let ba_Id = req.body.ba_Id;

  let orderJSON = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: "10.00"
        }
      }
    ]
  };

  let capture_json = {
    payment_source: {
      token: {
        id: ba_Id,
        type: "BILLING_AGREEMENT"
      }
    }
  };

  let paypalOrder = async () => {
    try {
      const token = await orderHelpers.tokenRequest();
      const createOrder = await orderHelpers.createOrder(token, orderJSON, res);
      const captureOrder = await orderHelpers.capturePaymentForOrder(
        token,
        createOrder,
        capture_json,
        res
      );
      return captureOrder;
    } catch (e) {
      console.error(e);
    }
  };

  paypalOrder();
});

module.exports = router;
