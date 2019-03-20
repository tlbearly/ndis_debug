define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!javascript/templates/HelpWin.html",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/on",
    "dojo/dom-construct",
    "dijit/registry",
    "dojox/mobile/SimpleDialog",
    "dojo/dom-class"
], function(
    declare,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    template,
    lang,
    dom,
    on,
    domConstruct,
    registry,
    SimpleDialog,
    domClass
) {
    // Use this if you have widgets in the template like a tab container that will be initialize in here.
    //	"dijit/_WidgetsInTemplateMixin",
    //   "dijit/_AttachMixin",
    //	var HelpWin = declare([_WidgetBase,_TemplatedMixin, _WidgetsInTemplateMixin, _AttachMixin], {
    widgetsInTemplate = true; // enhances preformance. Comment this out if you need to define widgets in your templates.
    var HelpWin = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        params: {},

        constructor: function(params) {
            lang.mixin(this, params);
            params = params || {};
        },
        startup: function() {
            this._title.innerHTML = this.params.label;
            this._content.innerHTML = this.params.content;
            this._closeBtn.onclick = lang.hitch(this, function(event) {
                //event.stopImmediatePropagation();
                this._dialog.hide();
            });
        },
        show: function() {
            this._dialog.show();
        },
        setContent: function(content) {
            this._content.innerHTML = content;
        }
    });
    return HelpWin;
});