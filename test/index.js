
var muri = require('../')
var assert = require('assert')

describe('muri', function(){
  it('must begin with mongodb://', function(done){
    assert.throws(function () {
      muri('localhost:27017');
    }, /Invalid mongodb uri/);
    assert.doesNotThrow(function () {
      muri('mongodb://localhost:27017');
    })
    done();
  })

  describe('user:password', function(done){
    it('is optional', function(done){
      var uri = 'mongodb://local:27017';
      var val = muri(uri);
      assert.ok(!val.auth);
      done();
    })

    it('parses properly', function(done){
      var uri = 'mongodb://user:password@local:27017';
      var val = muri(uri);
      assert.ok(val.auth);
      assert.equal('user', val.auth.user);
      assert.equal('password', val.auth.pass);
      done();
    })
  })

  describe('host', function(){
    it('must be specified', function(done){
      assert.throws(function () {
        muri('mongodb://');
      }, /Missing host/)
      assert.throws(function () {
        muri('mongodb://?yep');
      }, /Missing host/)
      assert.throws(function () {
        muri('mongodb:///?yep');
      }, /Missing host/)

      var val = muri('mongodb://local');
      assert.ok(Array.isArray(val.hosts));
      assert.equal(1, val.hosts.length);
      assert.equal('local', val.hosts[0].host);
      done();
    })

    it('supports replica sets', function(done){
      var val = muri('mongodb://local:27017,remote:27018,japan:99999');
      assert.ok(Array.isArray(val.hosts));
      assert.equal(3, val.hosts.length);
      assert.equal('local', val.hosts[0].host);
      assert.equal(27017, val.hosts[0].port);
      assert.equal('remote', val.hosts[1].host);
      assert.equal(27018, val.hosts[1].port);
      assert.equal('japan', val.hosts[2].host);
      assert.equal(99999, val.hosts[2].port);
      done();
    })
  })

  describe('port', function(){

    describe('with single host', function(){
      it('defaults to 27017 if not specified', function(done){
        var val = muri('mongodb://local/');
        assert.equal(27017, val.hosts[0].port);
        done();
      })

      it('uses what is specified', function(done){
        var val = muri('mongodb://local:27018');
        assert.equal(27018, val.hosts[0].port);
        done();
      })
    })

    describe('with replica sets', function(){
      var val;

      before(function(){
        val = muri('mongodb://local,remote:27018,another');
      })

      it('defaults to 27017 if not specified', function(done){
        assert.equal(27017, val.hosts[0].port);
        assert.equal(27017, val.hosts[2].port);
        done();
      })

      it('uses what is specified', function(done){
        assert.equal(27018, val.hosts[1].port);
        done();
      })
    })
  })

  describe('database', function(){
    it('defaults to admin', function(done){
      var val = muri('mongodb://localhost/');
      assert.equal('admin', val.db);
      var val = muri('mongodb://localhost');
      assert.equal('admin', val.db);
      done();
    })
    it('is overridable', function(done){
      var val = muri('mongodb://localhost,a,x:34343,b/muri');
      assert.equal('muri', val.db);
      done();
    })
  })

  describe('querystring separator', function(){
    it('can be ; ', function(done){
      var val = muri('mongodb://muri/?replicaSet=myreplset;slaveOk=true;x=1');
      assert.ok(val.options);
      assert.equal(true, val.options.slaveOk);
      assert.equal('myreplset', val.options.replicaSet);
      assert.equal(1, val.options.x);
      done();
    })
    it('can be & ', function(done){
      var val = muri('mongodb://muri/?replicaSet=myreplset&slaveOk=true&x=1');
      assert.ok(val.options);
      assert.equal(true, val.options.slaveOk);
      assert.equal('myreplset', val.options.replicaSet);
      assert.equal(1, val.options.x);
      done();
    })
  })

  it('all together now', function(done){
    var uri = 'mongodb://user:pass@local,remote:27018,japan:27019/neatdb'
    uri +=    '?replicaSet=myreplset&journal=true&w=2&wtimeoutMS=50'
    var val = muri(uri);

    assert.equal('user', val.auth.user);
    assert.equal('pass', val.auth.pass);
    assert.equal('neatdb', val.db);
    assert.equal(3, val.hosts.length);
    assert.equal('local', val.hosts[0].host);
    assert.strictEqual(27017, val.hosts[0].port);
    assert.equal('remote', val.hosts[1].host);
    assert.strictEqual(27018, val.hosts[1].port);
    assert.equal('japan', val.hosts[2].host);
    assert.strictEqual(27019, val.hosts[2].port);
    assert.equal('myreplset', val.options.replicaSet);
    assert.equal(true, val.options.journal);
    assert.equal(50, val.options.wtimeoutMS);
    done();
  })
})
