"use strict";

const express = require("express");
const iot = express.Router();
const call = require("../utilities/call");
const { withMinimumAuth } = require("../middleware/auth");

iot.all("*", withMinimumAuth("Lead"), async (req, res) => {
  const response = await call(process.env.IOT_MS_ROUTE + req.path, req.method, {
    headers: req.headers,
    json: req.body,
  });
  res.status(response.statusCode).json(response.body).end();
});

module.exports = iot;
