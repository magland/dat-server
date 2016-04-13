var fs = require('fs')
var path = require('path')
var test = require('tape')
var client = require('../client.js')
var os = require('os')
var sockPath = path.join(os.tmpdir(), 'datserver.sock')
var testdat = path.join(__dirname, 'testdat')

var TEST_HASH = 'c98a7c5c6fe0b539b496fbe73d4ec2f270106794774614c5fb52fc47fda3b236'

test('close and destroy kills the matt daemon', function (t) {
  client(function (err, rpc, conn) {
    t.ifErr(err)
    t.ok(true, 'called client callback')
    t.ok(fs.existsSync(sockPath), 'sock exists')
    rpc.close(function (err) {
      t.ifErr(err)
      t.ok(true, 'called close callback')
      conn.destroy()
      t.notOk(fs.existsSync(sockPath), 'sock does not exist')
      t.end()
    })
  })
})

test('link', function (t) {
  client(function (err, rpc, conn) {
    t.ifErr(err)
    rpc.link(testdat, function (err, link) {
      t.ifErr(err)
      t.equals(link, TEST_HASH)
      conn.destroy()
      t.end()
    })
  })
})

test('status', {timeout: 5000}, function (t) {
  client(function (err, rpc, conn) {
    t.ifErr(err, 'no err')
    rpc.link(testdat, function (err, link) {
      t.ifErr(err, 'no err')
      t.equals(link, TEST_HASH)
    })

    // tests basename
    rpc.status(function (err, status) {
      t.ifErr(err, 'no err')
      var key = Object.keys(status)[0]
      var dir = path.basename(key)
      t.equals(dir, 'testdat', 'basename matches')
    })

    // tests status value
    var gotCompleteStatus = false
    setTimeout(getStatus, 10)
    function getStatus () {
      if (gotCompleteStatus) {
        t.ok(true, 'got complete status')
        rpc.close(function (err) {
          t.ifErr(err, 'no err')
          conn.destroy()
          t.end()
        })
      }
      rpc.status(function (err, status) {
        if (err) t.ifErr(err, 'no err')
        var key = Object.keys(status)[0]
        if (status[key].progress.bytesRead === 3) gotCompleteStatus = true
        setTimeout(getStatus, 10)
      })
    }
  })
})

test('join', {timeout: 5000}, function (t) {
  client(function (err, rpc, conn) {
    t.ifErr(err, 'no err')
    var link
    rpc.link(testdat, function (err, hash) {
      t.ifErr(err, 'no err')
      link = hash
      t.equals(link, TEST_HASH)
      rpc.join(link, testdat, function (err) {
        t.ifErr(err, 'no err')
      })
    })

    // tests status value
    var gotCompleteStatus = false
    setTimeout(getStatus, 10)
    function getStatus () {
      if (gotCompleteStatus) {
        t.ok(true, 'got complete status')
        rpc.close(function (err) {
          t.ifErr(err, 'no err')
          conn.destroy()
          t.end()
        })
      }
      rpc.status(function (err, status) {
        if (err) t.ifErr(err, 'no err')
        var key = Object.keys(status)[0]
        if (status[key].progress.bytesRead === 3) gotCompleteStatus = true
        setTimeout(getStatus, 10)
      })
    }
  })
})