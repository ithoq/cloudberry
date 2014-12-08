requirejs.config({
    baseUrl: "app",
    paths: {
        'text': '../bower_components/requirejs-text/text',
        'durandal': '../bower_components/durandal/js',
        'plugins': '../bower_components/durandal/js/plugins',
        'transitions': '../bower_components/durandal/js/transitions',
        'knockout': '../bower_components/knockout.js/knockout',
        'jquery': '../bower_components/jquery/jquery',
        'bootstrap': '../bower_components/bootstrap/dist/js/bootstrap',
    },
    shim: {
        'bootstrap': {
            deps: ['jquery'],
            exports: 'jQuery'
        }
    }
});

var cloudberryDefaults = {
    "localization-debug": false,
    "language": {
        "default": "en",
        "options": ["en"]
    },
    "view-url": false,
    "app-element-id": "cloudberry",
    "rest-path": "",
    "templates-path": "views/",
    "limited-http-methods": false,
    "file-view": {
        "default-view-mode": false,
        "list-view-columns": {
            "name": {
                width: 250
            },
            "size": {},
            "file-modified": {
                width: 150
            }
        },
        "actions": {
            "click": function(item) {
                return "details";
            },
            "dbl-click": function(item) {
                return "file/open";
            },
            "right-click": function(item) {
                return "menu";
            },
            "mouse-over": "quickactions"
        }
    },
    "html5-uploader": {
        maxChunkSize: 0
    },
    dnd: {
        dragimages: {
            "filesystemitem-file": "css/images/mimetypes64/empty.png",
            "filesystemitem-folder": "css/images/mimetypes64/folder.png",
            "filesystemitem-many": "css/images/mimetypes64/application_x_cpio.png"
        }
    }
};

define("cloudberry/app", ['jquery', 'durandal/system', 'durandal/app', 'durandal/viewLocator'], function($, system, app, viewLocator) {
    var cloudberryApp = {};

    cloudberryApp.init = function(cfg) {
        cloudberryApp.config = $.extend({}, cloudberryDefaults, cfg);

        system.debug(true);

        app.title = 'Cloudberry';

        app.configurePlugins({
            router: true,
            dialog: true
        });

        app.start().then(function() {
            viewLocator.useConvention(false, cloudberryApp.config['templates-path']);

            app.setRoot('viewmodels/shell', false, 'cloudberry');
        });
    };
    return cloudberryApp;
});
