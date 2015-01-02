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
        'underscore': '../bower_components/underscore/underscore',
        'knockout-bootstrap': '../vendor/knockout-bootstrap',
        'i18next': '../bower_components/i18next/i18next.amd.withJQuery.min',
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

define("cloudberry/app", ['require', 'jquery', 'durandal/system', 'durandal/app', 'durandal/viewLocator', 'durandal/binder', 'i18next'], function(require, $, system, app, viewLocator, binder, i18n) {
    // load deps that don't need reference
    require(['cloudberry/platform']);

    var cloudberryApp = {};

    cloudberryApp.init = function(cfg) {
        cloudberryApp.config = $.extend({}, cloudberryDefaults, cfg);

        var i18NOptions = {
            detectFromHeaders: false,
            lng: cloudberryApp.config.language.default || window.navigator.userLanguage || window.navigator.language,
            fallbackLang: cloudberryApp.config.language.default,
            ns: 'app',
            resGetPath: 'app/localizations/__lng__/__ns__.json',
            useCookie: false
        };

        define("cloudberry/config", function() {
            return cloudberryApp.config;
        });

        system.debug(true);

        app.title = 'Cloudberry';

        app.configurePlugins({
            router: true,
            dialog: true
        });

        app.start().then(function() {
            viewLocator.useConvention(false, cloudberryApp.config['templates-path']);

            i18n.init(i18NOptions, function() {
                //Call localization on view before binding...
                binder.binding = function(obj, view) {
                    $(view).i18n();
                };

                require(['cloudberry/session'], function(session) {
                    session.init(cloudberryApp.config).then(function() {
                        app.setRoot('viewmodels/shell', false, 'cloudberry');
                    });
                });
            });
        });
    };
    return cloudberryApp;
});

define("cloudberry/session", ['jquery', 'cloudberry/core_service', 'durandal/app'],
    function($, service, da) {
        var _session = false;
        var _end = function() {
            //$rootScope.features = {};
            //$rootScope.session = null;
            da.trigger('session:end');
        };
        da.on('error:unauthorized').then(_end);

        var _set = function(s) {
            //$rootScope.features = s.features;

            if (!s || !s.user) {
                _session = {
                    id: false,
                    user: null
                }
            } else {
                _session = s;
                _session.user.admin = s.user.type == 'a';
            }
            //$rootScope.session = _session;
            da.trigger('session:start', _session);
        };
        //_set();
        return {
            get: function() {
                return _session;
            },
            end: function() {
                var df = $.Deferred();
                service.get('session/logout').done(function(s) {
                    df.resolve(s);
                    if (s) _end(s);
                }).fail(df.reject);
                return df.promise();
            },
            init: function() {
                var df = $.Deferred();
                service.get('session/info').done(function(s) {
                    df.resolve(s);
                    if (s) _set(s);
                }).fail(df.reject);
                return df.promise();
            },
            authenticate: function(username, pw, remember) {
                return service.post('session/login', {
                    name: username,
                    password: pw,
                    remember: !!remember
                }).done(function(s) {
                    _set(s);
                });
            }
        };
    });

define("cloudberry/service", ['jquery', 'cloudberry/config', 'durandal/app'],
    function($, config, da) {
        var _sessionId = false;

        da.on('session:start').then(function(session) {
            _sessionId = session.id;
        });
        da.on('session:end').then(function(session) {
            _sessionId = false;
        });


        var _limitedHttpMethods = !!config['limited-http-methods'];
        var _restPath = config['rest-path'];

        var _serviceInstance = function(prefix) {
            var urlFn = function(u, full) {
                if (u.startsWith('http')) return u;
                var url = _restPath + "r.php/" + (prefix || '') + u;
                if (!full) return url;
                return "TODO" + url; //cloudberry.App.pageUrl + url;
            };
            var doRequest = function(type, url, data) {
                var t = type;
                var diffMethod = (_limitedHttpMethods && (t == 'PUT' || t == 'DELETE'));
                if (diffMethod) t = 'POST';

                return (function(sid) {
                    return $.ajax({
                        type: t,
                        url: urlFn(url),
                        processData: false,
                        data: data ? JSON.stringify(data) : null,
                        contentType: 'application/json',
                        dataType: 'json',
                        beforeSend: function(xhr) {
                            if (sid)
                                xhr.setRequestHeader("cloudberry-session-id", sid);
                            if (_limitedHttpMethods || diffMethod)
                                xhr.setRequestHeader("cloudberry-http-method", type);
                        }
                    }).pipe(function(r) {
                        if (!r) {
                            return $.Deferred().reject({
                                code: 999
                            });
                        }
                        return r;
                    }, function(xhr) {
                        var df = $.Deferred();

                        // if session has expired since starting request, ignore it
                        if (_sessionId != sid) return df;

                        var error = false;
                        var data = false;

                        if (xhr.responseText && xhr.responseText.startsWith('{')) {
                            try {
                                error = JSON.parse($.trim(xhr.responseText));
                            } catch (e) {
                                error = {
                                    code: 999,
                                    details: "Could not parse error JSON, response: [" + xhr.responseText + "]"
                                };
                            }
                        }
                        if (!error) error = {
                            code: 999
                        }; //unknown

                        var failContext = {
                            handled: false
                        }
                        if (error.code == 100 && _sessionId) {
                            app.trigger('error:unauthorized');
                            failContext.handled = true;
                        }
                        // push default handler to end of callback list
                        setTimeout(function() {
                            df.fail(function(err) {
                                if (!failContext.handled) window.alert(JSON.stringify(err)); //TODO cloudberry.ui.dialogs.showError(err);
                            });
                        }, 0);
                        return df.rejectWith(failContext, [error]);
                    }).promise()
                }(_sessionId));
            };
            return {
                prefix: prefix,
                url: urlFn,

                get: function(url) {
                    return doRequest("GET", url, null);
                },

                post: function(url, data) {
                    return doRequest("POST", url, data);
                },

                put: function(url, data) {
                    return doRequest("PUT", url, data);
                },

                del: function(url, data) {
                    return doRequest("DELETE", url, data);
                },

                withPrefix: function(prefix) {
                    return _serviceInstance(prefix);
                }
            };
        };
        return {
            get: function(prefix) {
                return _serviceInstance(prefix || "");
            }
        };
    }
);

define("cloudberry/core_service", ['cloudberry/service'],
    function(service) {
        var cs = service.get("api/v1/");
        return cs;
    }
);

define("cloudberry/filesystem", ['cloudberry/core_service', 'cloudberry/permissions', 'durandal/app'],
    function(service, permissions, da) {
        var _roots = [];
        var _rootsById = [];
        da.on('session:start').then(function(session) {
            _roots = session.folders ? session.folders : [];
            $.each(_roots, function(i, r) {
                _rootsById[r.id] = r;
            })
        });
        da.on('session:end').then(function(session) {
            _roots = [];
            _rootsById = {};
        });

        return {
            roots: function() {
                return _roots;
            },
            root: function(id) {
                return _rootsById[id];
            },
            rootsById: function() {
                return _rootsById;
            },
            folderInfo: function(folderId) {
                return service.post("filesystem/" + folderId + "/info/", {
                    children: true,
                    hierarchy: true,
                    permissions: true
                }).pipe(function(r) {
                    permissions.putFilesystemPermissions(folderId, r.permissions);

                    var folder = r.folder;
                    var data = r;
                    data.items = r.children; //r.folders.slice(0).concat(r.files);
                    data.hierarchy = r.hierarchy;
                    //if (r.hierarchy)
                    //    r.hierarchy[0] = _rootsById[r.hierarchy[0].id];
                    return data;
                });
            }
        };
    }
);

define("cloudberry/platform", [
    "durandal/composition",
    "knockout",
    "jquery",
    "bootstrap",
    "knockout-bootstrap"
], function(composition, ko, $) {

});

/*define(['durandal/system', 'plugins/dialog', 'durandal/app', 'durandal/viewEngine', 'knockout'], function(system, dialog, app, viewEngine, ko) {
    dialog.addContext('bootstrapModal', {
        blockoutOpacity: .2,
        removeDelay: 300,
        addHost: function(theDialog) {
            var body = $('body');
            var host = $('<div class="modal fade" id="bootstrapModal" tabindex="-1" role="dialog" data-keyboard="false" aria-labelledby="bootstrapModal" aria-hidden="true"></div>')
                .appendTo(body);
            theDialog.host = host.get(0);
        },
        removeHost: function(theDialog) {
            $('#bootstrapModal').modal('hide');
            $('body').removeClass('modal-open');
        },
        attached: null,
        compositionComplete: function(child, parent, context) {
            var theDialog = dialog.getDialog(context.model);
            var options = {};
            options.show = true;
            $('#bootstrapModal').modal(options);
            $('#bootstrapModal').on('hidden.bs.modal', function(e) {
                theDialog.close();
                ko.removeNode(theDialog.host);
                $('.modal-backdrop').remove();
            });
        }
    });
    var bootstrapMarkup = [
        '<div data-view="plugins/messageBox" data-bind="css: getClass(), style: getStyle()">',
        '<div class="modal-content">',
        '<div class="modal-header">',
        '<h3 data-bind="html: title"></h3>',
        '</div>',
        '<div class="modal-body">',
        '<p class="message" data-bind="html: message"></p>',
        '</div>',
        '<div class="modal-footer">',
        '<!-- ko foreach: options -->',
        '<button data-bind="click: function () { $parent.selectOption($parent.getButtonValue($data)); }, text: $parent.getButtonText($data), css: $parent.getButtonClass($index)"></button>',
        '<!-- /ko -->',
        '<div style="clear:both;"></div>',
        '</div>',
        '</div>',
        '</div>'
    ].join('\n');
    var bootstrapModal = function() {};
    bootstrapModal.install = function() {
        app.showBootstrapDialog = function(obj, activationData) {
            return dialog.show(obj, activationData, 'bootstrapModal');
        };
        app.showBootstrapMessage = function(message, title, options, autoclose, settings) {
            return dialog.showBootstrapMessage(message, title, options, autoclose, settings);
        };

        dialog.showBootstrapDialog = function(obj, activationData) {
            return dialog.show(obj, activationData, 'bootstrapModal');
        }
        dialog.showBootstrapMessage = function(message, title, options, autoclose, settings) {
            if (system.isString(this.MessageBox)) {
                return dialog.show(this.MessageBox, [
                    message,
                    title || this.MessageBox.defaultTitle,
                    options || this.MessageBox.defaultOptions,
                    autoclose || false,
                    settings || {}
                ], 'bootstrapModal');
            }
            var bootstrapDefaults = {
                buttonClass: "btn btn-default",
                primaryButtonClass: "btn-primary autofocus",
                secondaryButtonClass: "",
                "class": "modal-dialog",
                style: null
            };
            this.MessageBox.prototype.getView = function() {
                return viewEngine.processMarkup(bootstrapMarkup);
            };
            var bootstrapSettings = $.extend(bootstrapDefaults, settings);
            return dialog.show(new dialog.MessageBox(message, title, options, autoclose, bootstrapSettings), {}, 'bootstrapModal');
        };
        dialog.MessageBox.prototype.compositionComplete = function(child, parent, context) {
            var theDialog = dialog.getDialog(context.model);
            var $child = $(child);
            if ($child.hasClass('autoclose') || context.model.autoclose) {
                $(theDialog.blockout).click(function() {
                    theDialog.close();
                });
            }
        };
    };
    return bootstrapModal;
});*/

window.cloudberry = {
    platform: [],
    actions: [],
    filelist: {
        columns: []
    },

    //TODO break utils
    utils: {
        createObj: function neu(constructor, args) {
            // http://www.ecma-international.org/ecma-262/5.1/#sec-13.2.2
            var instance = Object.create(constructor.prototype);
            var result = constructor.apply(instance, args);

            // The ECMAScript language types are Undefined, Null, Boolean, String, Number, and Object.
            return (result !== null && typeof result === 'object') ? result : instance;
        },

        deferreds: function(m) {
            var master = $.Deferred();
            var res = {
                success: {},
                fail: {}
            };
            var all = cloudberry.utils.getKeys(m);
            var count = all.length;
            $.each(all, function(i, dk) {
                var df = m[dk];
                df.done(function(r) {
                    res.success[dk] = r;
                    count--;
                    if (count === 0) master.resolve(res);
                }).fail(function(r) {
                    res.fail[dk] = r;
                    count--;
                    if (count === 0) master.resolve(res);
                });
            });
            return master.promise();
        },

        breakUrl: function(u) {
            var parts = u.split("?");
            return {
                path: parts[0],
                params: cloudberry.helpers.getUrlParams(u),
                paramsString: (parts.length > 1 ? ("?" + parts[1]) : "")
            };
        },

        getUrlParams: function(u) {
            var params = {};
            $.each(u.substring(1).split("&"), function(i, p) {
                var pp = p.split("=");
                if (!pp || pp.length < 2) return;
                params[decodeURIComponent(pp[0])] = decodeURIComponent(pp[1]);
            });
            return params;
        },

        urlWithParam: function(url, param, v) {
            var p = param;
            if (v) p = param + "=" + encodeURIComponent(v);
            return url + (window.strpos(url, "?") ? "&" : "?") + p;
        },

        noncachedUrl: function(url) {
            return cloudberry.utils.urlWithParam(url, "_=" + cloudberry._time);
        },

        formatDateTime: function(time, fmt) {
            var ft = time.toString(fmt);
            return ft;
        },

        parseInternalTime: function(time) {
            if (!time || time == null || typeof(time) !== 'string' || time.length != 14) return null;

            var ts = new Date();
            ts.setYear(time.substring(0, 4));
            ts.setMonth(time.substring(4, 6) - 1);
            ts.setDate(time.substring(6, 8));
            ts.setHours(time.substring(8, 10));
            ts.setMinutes(time.substring(10, 12));
            ts.setSeconds(time.substring(12, 14));
            return ts;
        },

        formatInternalTime: function(time) {
            if (!time) return null;
            return cloudberry.utils.formatDateTime(time, 'yyyyMMddHHmmss');
        },

        mapByKey: function(list, key, value) {
            var byKey = {};
            if (!list) return byKey;
            for (var i = 0, j = list.length; i < j; i++) {
                var r = list[i];
                if (!window.def(r)) continue;
                var v = r[key];
                if (!window.def(v)) continue;

                if (window.def(value) && r[value])
                    byKey[v] = r[value];
                else
                    byKey[v] = r;
            }
            return byKey;
        },

        getKeys: function(m) {
            var list = [];
            if (m)
                for (var k in m) {
                    if (!m.hasOwnProperty(k)) continue;
                    list.push(k);
                }
            return list;
        },

        extractValue: function(list, key) {
            var l = [];
            for (var i = 0, j = list.length; i < j; i++) {
                var r = list[i];
                l.push(r[key]);
            }
            return l;
        },

        filter: function(list, f) {
            var result = [];
            $.each(list, function(i, it) {
                if (f(it)) result.push(it);
            });
            return result;
        },

        arrayize: function(i) {
            var a = [];
            if (!window.isArray(i)) {
                a.push(i);
            } else {
                return i;
            }
            return a;
        }
    }
};

if (!window.isArray)
    window.isArray = function(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    }

if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    }
}

if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function(s) {
        if (!s || s.length === 0) return false;
        return this.substring(0, s.length) == s;
    }
}

if (typeof String.prototype.count !== 'function') {
    String.prototype.count = function(search) {
        var m = this.match(new RegExp(search.toString().replace(/(?=[.\\+*?\[\^\]$(){}\|])/g, "\\"), "g"));
        return m ? m.length : 0;
    }
}

if (!window.def)
    window.def = function(o) {
        return (typeof(o) != 'undefined');
    }

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, start) {
        for (var i = (start || 0), j = this.length; i < j; i++) {
            if (this[i] === obj) {
                return i;
            }
        }
        return -1;
    }
}

if (!Array.prototype.remove) {
    Array.prototype.remove = function(from, to) {
        if (typeof(to) == 'undefined' && typeof(from) == 'object')
            from = this.indexOf(from);
        if (from < 0) return;
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    };
}

if (!window.strpos)
    window.strpos = function(haystack, needle, offset) {
        // Finds position of first occurrence of a string within another  
        // 
        // version: 1109.2015
        // discuss at: http://phpjs.org/functions/strpos
        // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Onno Marsman    
        // +   bugfixed by: Daniel Esteban
        // +   improved by: Brett Zamir (http://brett-zamir.me)
        var i = (haystack + '').indexOf(needle, (offset || 0));
        return i === -1 ? false : i;
    }
