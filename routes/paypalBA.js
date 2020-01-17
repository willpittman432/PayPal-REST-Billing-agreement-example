const express = require("express");
const router = express.Router();
const axios = require("axios");
const base64 = require("base-64");
const config = require("../config/config");

let billingAgreementHelpers = {};

billingAgreementHelpers.getCreds = () => {
  let client_id = config.creds.client_id;
  let client_secret = config.creds.client_secret;
  let stringToEncode = `${client_id}:${client_secret}`;
  let encodedString = base64.encode(stringToEncode);
  return encodedString;
};

billingAgreementHelpers.tokenRequest = () => {
  return new Promise(resolve => {
    axios
      .post(
        "https://api.sandbox.paypal.com/v1/oauth2/token",
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${billingAgreementHelpers.getCreds()}`
          }
        }
      )
      .then(response => resolve(response.data.access_token))
      .catch(err => console.error(err));
  });
};

billingAgreementHelpers.createBillingToken = (access_token, json, res) => {
  return new Promise(resolve => {
    axios
      .post(
        "https://api.sandbox.paypal.com/v1/billing-agreements/agreement-tokens",
        json,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`
          }
        }
      )
      .then(response => {
        resolve(res.send({ billingToken: response.data.token_id }));
      });
  });
};

billingAgreementHelpers.createBillingAgreement = (
  access_token,
  ba_token,
  res
) => {
  return new Promise(resolve => {
    axios
      .post(
        "https://api.sandbox.paypal.com/v1/billing-agreements/agreements",
        { token_id: ba_token },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`
          }
        }
      )
      .then(response => resolve(res.send({ billingAgreement: response.data })));
  });
};

router.get("/", (req, res) => {
  res.render("paypalBA");
});

router.post("/ba_token", (req, res) => {
  let billing_token_json = {
    description: "Billing Agreement",
    shipping_address: {
      line1: "1350 North First Street",
      city: "San Jose",
      state: "CA",
      postal_code: "95112",
      country_code: "US",
      recipient_name: "John Doe"
    },
    payer: {
      payment_method: "PAYPAL"
    },
    plan: {
      type: "MERCHANT_INITIATED_BILLING_SINGLE_AGREEMENT",
      merchant_preferences: {
        return_url: "https://www.paypal.com/checkoutnow/error",
        cancel_url: "https://www.paypal.com/checkoutnow/error",
        accepted_pymt_type: "INSTANT",
        skip_shipping_address: false,
        immutable_shipping_address: true
      }
    }
  };

  let initFlow = async () => {
    try {
      const token = await billingAgreementHelpers.tokenRequest();
      const createBaToken = await billingAgreementHelpers.createBillingToken(
        token,
        billing_token_json,
        res
      );
      return createBaToken;
    } catch (e) {
      console.error(e);
    }
  };

  initFlow();
});

router.post("/ba_id", (req, res) => {
  console.log(req.body);
  let billingToken = req.body.billingToken;

  let initFlow = async () => {
    try {
      const token = await billingAgreementHelpers.tokenRequest();
      const billingAgreement = await billingAgreementHelpers.createBillingAgreement(
        token,
        billingToken,
        res
      );
      console.log(billingToken);
      return billingAgreement;
    } catch (e) {
      console.error(e);
    }
  };

  initFlow();
});

module.exports = router;
