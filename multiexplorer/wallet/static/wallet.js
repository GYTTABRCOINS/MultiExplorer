var bip44_coin_types = {};
$.each(crypto_data, function(i, data) {

    var network = {};
    network.alias = data['code'];
    network.name = data['name'];
    network.pubkeyhash = data['address_byte'];
    network.privatekey = data['private_key_prefix'];
    bip44_coin_types[data['code']] = data['bip44'];

    if(data['code'] != 'btc') {
        bitcore.Networks.add(network);
    }
});

function get_crypto_root(crypto) {
    var bip44_coin_type = undefined;
    var address_byte = undefined;
    var bip44 = bip44_coin_types[crypto];

    if(crypto == 'btc') {
        crypto = 'livenet';
    }

    var network = bitcore.Networks.get(crypto);

    //                         purpose       coin type
    return hd_master_seed.derive(44, true).derive(bip44);
}

function derive_addresses(xpriv, crypto, change, index) {
    //           account             change             index
    xpriv = xpriv.derive(0, true).derive(change ? 1 : 0).derive(index);

    if(crypto == 'btc') {
        crypto = 'livenet';
    }

    var wif = bitcore.PrivateKey(xpriv.privateKey.toString(), crypto).toWIF();
    return [wif, xpriv.privateKey.toAddress(crypto).toString()];
}

function get_deposit_keypair(crypto, index) {
    return derive_addresses(get_crypto_root(crypto), crypto, false, index);
}

function get_change_keypair(crypto, index) {
    return derive_addresses(get_crypto_root(crypto), crypto, true, index);
}

function get_balance_for_crypto(crypto) {
    var xpriv = get_crypto_root(crypto);


}

function open_wallet() {
    $("#register_box, #login_box").hide();
    $(".balances").show();

    $.each(wallet_state, function(i, data) {
        var crypto = data.code;
        var xpriv = get_crypto_root(crypto);

        var args = "?xpub=" + xpriv.hdPublicKey.toString() + "&currency=" + crypto;
        $.ajax({
            'url': "/api/address_balance/fallback" + args,
            'type': 'get',
        }).success(function (response) {
            box.find(".balance").text(response.balance);
        });

        var box = $(".crypto_box[data-currency=" + crypto + "]");
        var index = data.deposit_head + 1
        var latest_deposit = get_deposit_keypair(crypto, index);
        box.find(".address").text(latest_deposit[1]);
        box.find(".qr").qrcode({width: 100, height: 100, text: latest_deposit[1]});
    });
}