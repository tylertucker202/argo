var Profile = require('../models/profile');
var async = require('async');
var moment = require('moment');

//station_parameters, lat, lon are needed for virtural fields
const mapParams = 'platform_number date geoLocation cycle_number station_parameters lat lon';

// Display list of all platforms
exports.index = function(req, res) {   
    async.parallel({
        profile_count: function(callback) {
            Profile.count(callback);
        },
    }, function(err, results) {
        res.render('index', { title: 'Argo Selection Home', error: err, data: results });
    });
};

// Display db detail form on GET
exports.db_list = function(req, res) {
    res.send('NOT IMPLEMENTED: db show');
};

// Display list of all platforms
exports.platform_list = function(req, res, next) {
    var query = Profile.aggregate([
                       {$sort: { 'date':-1}},
                       {$group: {_id: '$platform_number',
                                 'platform_number': {$first: '$platform_number'},
                                 'most_recent_date': {$first: '$date'},
                                 'number_of_profiles': {$sum: 1},
                                 'cycle_number': {$first: '$cycle_number'},
                                 'geoLocation': {$first: '$geoLocation'}, 
                                 'dac': {$first: '$dac'}}}
    ]);
    query.exec( function (err, profile) {
        if (err) return next(err);
        res.json(profile);
    });
};

// Display platform detail form on GET
exports.platform_detail = function (req, res, next) {
    req.sanitize('platform_number').escape();

    req.getValidationResult().then(function (result) {
    if (!result.isEmpty()) {
        var errors = result.array().map(function (elem) {
            return elem.msg;
        });
        res.render('register', { errors: errors });
    }
    else {
        var query = Profile.find({platform_number: req.params.platform_number});
        if (req.params.format==='map') {
            query.select(mapParams);
        }
        query.exec(function (err, profiles) {
            if (err) return next(err);
            if (req.params.format==='page'){
                if (profiles.length === 0) { res.send('platform not found'); }
                else {
                    res.render('platform_page', {title:req.params.platform_number, profiles: JSON.stringify(profiles), moment: moment })
                }
            }
            else if (req.params.format==='page2'){
                if (profiles.length === 0) { res.send('platform not found'); }
                else {
                    res.render('selected_profile_page_collated', {title:req.params.platform_number, profiles: JSON.stringify(profiles), moment: moment })
                }
            }
            else{
                res.json(profiles)
            }
        });
    }})
};
