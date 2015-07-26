;(function () {

    var pluginName = 'zoomcrop';

    function Plugin (element, options) {
        // setup
        this.setup (element, options || {});

        if (!options.readonly){
            // events binding
            this.bindEvents();
        }
    };

    Plugin.prototype.setup = function (element, options){
        var defaults = {
            handle: '.zoomcrop-handle',
            zoomControl: '.zoomcrop-control',
            maxScale: 2
        };

        this.settings = $.extend({}, defaults, options);

        this.$holder = $(element);

        this.$element = $(this.settings.element, element);
        this.setupElement();

        this.$handle = $(this.settings.handle, element);
        this.setupHandle();

        if (!options.readonly) {
            this.$zoomControl = $(this.settings.zoomControl, element);
            this.setupZoomControl();
        }

        if (options.value) {
            this.val(options.value);
        }
        if (typeof options.getValue === 'function'){
            this.val(options.getValue.bind(this) (this.$element));
        }
    };

    Plugin.prototype.setupElement = function(){
        this.elementWidth = this.$element.outerWidth();
        this.elementHeight = this.$element.outerHeight();

        var holderWidth = this.$holder.outerWidth();
        var width = this.elementWidth;
        var height = this.elementHeight;

        this.settings.minScale = width < height ? holderWidth / width : holderWidth / height;

        this.$element.css({
            'margin-left': - width / 2,
            'margin-top' : - height / 2,
            '-webkit-transform': 'scale(' + this.settings.minScale + ')'
        });
    };

    Plugin.prototype.setupHandle = function(){
        var handleWidth = this.elementWidth * this.settings.maxScale;
        var handleHeight = this.elementHeight * this.settings.maxScale;

        this.$handle.css({
            'width' : handleWidth,
            'height': handleHeight,
            'left'  : -handleWidth/2 + this.settings.minScale*this.elementWidth/2,
            'top'   : -handleHeight/2 + this.settings.minScale*this.elementHeight/2
        });

        if (!this.settings.readonly){
            this.$handle.draggable();
        }
    };

    Plugin.prototype.setupZoomControl = function(){
        noUiSlider.create(this.$zoomControl [0], {
            start: this.settings.minScale,
            orientation: 'vertical',
            direction: 'rtl',
            range: {
                'min': [ this.settings.minScale ],
                'max': [ this.settings.maxScale ]
            }
        });
        this.currentScale = this.settings.minScale;
    };

    Plugin.prototype.setScale = function(values, index, value){
        value = (value || 0).toFixed(4);
        requestAnimationFrame(function(){
            this.$element [0].style ['-webkit-transform'] = 'scale('+value+')';
            this.currentScale = parseFloat(value);
        }.bind(this));
    };

    Plugin.prototype.validateBoundaries = function(){
        var $handle = this.$handle,
            handleWidth = $handle.outerWidth(),
            handleHeight = $handle.outerHeight();

        var $holder = this.$holder,
            holderWidth = $holder.outerWidth(),
            holderHeight = $holder.outerHeight();

        var left = parseInt($handle.css('left'),10),
            top = parseInt($handle.css('top'),10);

        var scaledWidth = this.$element.outerWidth() * this.currentScale,
            scaledHeight = this.$element.outerHeight() * this.currentScale;

        var leftEdge = left + (handleWidth - scaledWidth)/2,
            rightEdge = leftEdge + scaledWidth,
            topEdge = top + (handleHeight - scaledHeight)/2,
            bottomEdge = topEdge + scaledHeight;

        requestAnimationFrame(function(){
            if (topEdge > 0){
                $handle.css({
                    'top': -handleHeight/2 + scaledHeight/2
                });
            } else if (bottomEdge < holderHeight){
                $handle.css({
                    'top': holderHeight - handleHeight/2 - scaledHeight/2
                });
            }
            if (leftEdge > 0){
                $handle.css({
                    'left': -handleWidth/2 + scaledWidth/2
                });
            } else if (rightEdge < holderWidth){
                $handle.css({
                    'left': holderWidth - handleWidth/2 - scaledWidth/2
                });
            }
        }.bind(this));

        var x = -Math.round(leftEdge / this.currentScale);
        var y = -Math.round(leftEdge / this.currentScale);

        return {
            x: x <= 0 ? 0 : x,
            y: y <= 0 ? 0 : y,
            width: Math.round(holderWidth / this.currentScale),
            height: Math.round(holderHeight / this.currentScale)
        };
    };

    Plugin.prototype.bindEvents = function(){
        this.$zoomControl [0].noUiSlider.on('slide', this.setScale.bind(this));
        this.$zoomControl [0].noUiSlider.on('change', this.validateBoundaries.bind(this));
        this.$handle.on('dragstop', this.validateBoundaries.bind(this));
    };

    Plugin.prototype._readCrop = function(){
        return this.validateBoundaries();
    };

    Plugin.prototype._setCrop = function(value){
        var $handle = this.$handle,
            handleWidth = $handle.outerWidth(),
            handleHeight = $handle.outerHeight();

        var holderWidth = this.$holder.outerWidth();

        var scale = holderWidth / value.width,
            leftEdge = -value.x * scale,
            topEdge = -value.y * scale;

        var scaledWidth = this.$element.outerWidth() * scale,
            scaledHeight = this.$element.outerHeight() * scale;

        var left = leftEdge - (handleWidth - scaledWidth)/2,
            top  = topEdge - (handleHeight - scaledHeight)/2;

        this.$handle.css({
            'left': left,
            'top': top
        });
        this.setScale(null, null, scale);

        return this;
    };

    Plugin.prototype.val = function(){
        return arguments.length ? this._setCrop.apply(this, arguments) : this._readCrop();
    };

    $.fn [pluginName] = function (options)  {
        return this.each (function (){
            if (!$.data (this, pluginName)) {
                $.data (this, pluginName, new Plugin (this, options));
            } else {
                $.data (this, pluginName).update();
            }
        });
    };

})();