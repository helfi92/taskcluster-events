#!usr/bin/env node
'use strict'
var base    = require('taskcluster-base');
var path    = require('path');
var debug   = require('debug')('events:bin:server');
var socket  = require('../events/socket');
var express = require('express');
var path    = require('path');
var assert  = require('assert');
var docs    = require('taskcluster-lib-docs');

var launch = (profile) => {
  var cfg = base.config({profile:  profile});
  // Create app
  var app = new base.app({
    port:               Number(process.env.PORT || cfg.port),
    forceSSL:           cfg.forceSSL,
    trustProxy:         cfg.trustProxy,
    forceSSL:           cfg.forceSSL,
    trustProxy:         cfg.trustProxy,
    env:                cfg.env || 'development'
  });

  // Serve static content from assets/
  app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

  return docs.documenter({
    credentials: cfg.taskcluster.credentials,
    tier: 'core' })
    .then(() => app.createServer())
    .then(server=>{
      socket.create(server,{
        credentials:      cfg.pulse,
        publicUrl:        cfg.hostname,
        component:        cfg.events.statsComponent
      });
      return server;
    });
}

// If server.js is executed start the server
if (!module.parent) {
  // Find configuration profile
  var profile = process.argv[2];
  if (!profile) {
    console.log("Usage: server.js [profile]")
    console.error("ERROR: No configuration profile is provided");
  }
  // Launch with given profile
  launch(profile).then(function() {
    debug("Launched server successfully");
  }).catch(function(err) {
    debug("Failed to start server, err: %s, as JSON: %j", err, err, err.stack);
    // If we didn't launch the server we should crash
    process.exit(1);
  });
}

module.exports = launch;
