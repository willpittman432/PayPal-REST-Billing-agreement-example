const express = require("express");
const router = express.Router();
const base64 = require("base-64");
const axios = require("axios");

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
      .then(response => {
        resolve(response.data.access_token);
      })
      .catch(err => console.error(err));
  });
};

orderHelpers.getOrderDetails = (accessToken, orderID, res) => {
  return new Promise(resolve => {
    axios
      .get(`https://api.sandbox.paypal.com/v2/checkout/orders/${orderID}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        }
      })
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

orderHelpers.capturePaymentForOrder = (access_token, orderId, res) => {
  return new Promise(resolve => {
    axios
      .post(
        `https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`
          }
        }
      )
      .then(response => resolve(res.send({ data: response.data })))
      .catch(e => console.log(e.response));
  });
};

//ENDPOINTS

//GET Render Page
router.get("/", (req, res) => {
  res.render("paypalOrderComplete");
});

/**POST
 * on page load, get billing agreement details
 */
router.post("/get_order_details", (req, res) => {
  let orderID = req.body.orderID;

  let getOrderDetails = async () => {
    try {
      const token = await orderHelpers.tokenRequest();
      const getOrderDetails = await orderHelpers.getOrderDetails(
        token,
        orderID,
        res
      );
      return getOrderDetails;
    } catch (e) {
      console.error(e);
    }
  };
  getOrderDetails();
});

/**
 * POST
 * Create PayPal Order and Capture
 */
router.post("/completeOrder", (req, res) => {
  console.log("reached complete order");
  let orderID = req.body.orderID;
  console.log(orderID);
  let paypalOrder = async () => {
    try {
      const token = await orderHelpers.tokenRequest();
      const captureOrder = await orderHelpers.capturePaymentForOrder(
        token,
        orderID,
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
