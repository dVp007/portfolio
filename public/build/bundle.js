
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.22.2 */

    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div0;
    	let ul;
    	let li0;
    	let b0;
    	let t1;
    	let li1;
    	let b1;
    	let t3;
    	let li2;
    	let b2;
    	let t5;
    	let section0;
    	let div4;
    	let div3;
    	let div1;
    	let h10;
    	let t7;
    	let h11;
    	let t9;
    	let hr;
    	let t10;
    	let img;
    	let img_src_value;
    	let t11;
    	let div2;
    	let h50;
    	let t13;
    	let h30;
    	let t15;
    	let p0;
    	let t17;
    	let a;
    	let t19;
    	let section1;
    	let div8;
    	let div7;
    	let div5;
    	let h51;
    	let t21;
    	let h31;
    	let t23;
    	let p1;
    	let t25;
    	let div6;
    	let h52;
    	let t27;
    	let h32;
    	let t29;
    	let p2;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			b0 = element("b");
    			b0.textContent = "Services";
    			t1 = space();
    			li1 = element("li");
    			b1 = element("b");
    			b1.textContent = "About";
    			t3 = space();
    			li2 = element("li");
    			b2 = element("b");
    			b2.textContent = "Work";
    			t5 = space();
    			section0 = element("section");
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Dharmil";
    			t7 = space();
    			h11 = element("h1");
    			h11.textContent = "Parekh";
    			t9 = space();
    			hr = element("hr");
    			t10 = space();
    			img = element("img");
    			t11 = space();
    			div2 = element("div");
    			h50 = element("h5");
    			h50.textContent = "-Introduction";
    			t13 = space();
    			h30 = element("h3");
    			h30.textContent = "Full Stack Developer based in India";
    			t15 = space();
    			p0 = element("p");
    			p0.textContent = "Innovative optimized solution seeker. Excited to be at the development phase of my new career as a web developer. I am ambitious, adventurous and assiduos.";
    			t17 = space();
    			a = element("a");
    			a.textContent = "For More Info";
    			t19 = space();
    			section1 = element("section");
    			div8 = element("div");
    			div7 = element("div");
    			div5 = element("div");
    			h51 = element("h5");
    			h51.textContent = "-Contact";
    			t21 = space();
    			h31 = element("h3");
    			h31.textContent = "Full Stack Developer based in India";
    			t23 = space();
    			p1 = element("p");
    			p1.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do\n            eiusmod tempor incididunt ut labore et";
    			t25 = space();
    			div6 = element("div");
    			h52 = element("h5");
    			h52.textContent = "-Contact";
    			t27 = space();
    			h32 = element("h3");
    			h32.textContent = "Full Stack Developer based in India";
    			t29 = space();
    			p2 = element("p");
    			p2.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do\n            eiusmod tempor incididunt ut labore et";
    			add_location(b0, file, 115, 6, 1979);
    			attr_dev(li0, "class", "active svelte-asupnh");
    			add_location(li0, file, 114, 4, 1929);
    			add_location(b1, file, 118, 6, 2045);
    			attr_dev(li1, "class", "svelte-asupnh");
    			add_location(li1, file, 117, 4, 2009);
    			add_location(b2, file, 121, 6, 2107);
    			attr_dev(li2, "class", "svelte-asupnh");
    			add_location(li2, file, 120, 4, 2072);
    			attr_dev(ul, "class", "navbar svelte-asupnh");
    			add_location(ul, file, 113, 2, 1905);
    			attr_dev(div0, "class", "container svelte-asupnh");
    			add_location(div0, file, 112, 0, 1879);
    			attr_dev(h10, "class", "svelte-asupnh");
    			add_location(h10, file, 129, 8, 2248);
    			attr_dev(h11, "class", "svelte-asupnh");
    			add_location(h11, file, 130, 8, 2273);
    			attr_dev(hr, "class", "svelte-asupnh");
    			add_location(hr, file, 131, 2, 2291);
    			attr_dev(div1, "class", "name svelte-asupnh");
    			add_location(div1, file, 128, 6, 2221);
    			if (img.src !== (img_src_value = "./profpic.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "350px");
    			attr_dev(img, "class", "svelte-asupnh");
    			add_location(img, file, 133, 6, 2315);
    			attr_dev(h50, "class", "svelte-asupnh");
    			add_location(h50, file, 135, 8, 2388);
    			attr_dev(h30, "class", "svelte-asupnh");
    			add_location(h30, file, 136, 8, 2419);
    			attr_dev(p0, "class", "svelte-asupnh");
    			add_location(p0, file, 137, 8, 2472);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-asupnh");
    			add_location(a, file, 140, 2, 2657);
    			attr_dev(div2, "class", "info svelte-asupnh");
    			add_location(div2, file, 134, 6, 2361);
    			attr_dev(div3, "class", "banner svelte-asupnh");
    			add_location(div3, file, 127, 4, 2194);
    			attr_dev(div4, "class", "container svelte-asupnh");
    			add_location(div4, file, 126, 2, 2166);
    			attr_dev(section0, "id", "name");
    			attr_dev(section0, "class", "svelte-asupnh");
    			add_location(section0, file, 125, 0, 2144);
    			attr_dev(h51, "class", "svelte-asupnh");
    			add_location(h51, file, 150, 10, 2866);
    			attr_dev(h31, "class", "svelte-asupnh");
    			add_location(h31, file, 151, 10, 2894);
    			attr_dev(p1, "class", "svelte-asupnh");
    			add_location(p1, file, 152, 10, 2949);
    			attr_dev(div5, "class", "column svelte-asupnh");
    			add_location(div5, file, 148, 6, 2826);
    			attr_dev(h52, "class", "svelte-asupnh");
    			add_location(h52, file, 160, 10, 3163);
    			attr_dev(h32, "class", "svelte-asupnh");
    			add_location(h32, file, 161, 10, 3191);
    			attr_dev(p2, "class", "svelte-asupnh");
    			add_location(p2, file, 162, 10, 3246);
    			attr_dev(div6, "class", "column svelte-asupnh");
    			add_location(div6, file, 158, 6, 3123);
    			attr_dev(div7, "class", "row svelte-asupnh");
    			add_location(div7, file, 147, 4, 2802);
    			attr_dev(div8, "class", "container svelte-asupnh");
    			add_location(div8, file, 146, 2, 2774);
    			attr_dev(section1, "id", "contactus");
    			attr_dev(section1, "class", "bg-gray svelte-asupnh");
    			add_location(section1, file, 145, 0, 2731);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, ul);
    			append_dev(ul, li0);
    			append_dev(li0, b0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, b1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, b2);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, section0, anchor);
    			append_dev(section0, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, h10);
    			append_dev(div1, t7);
    			append_dev(div1, h11);
    			append_dev(div1, t9);
    			append_dev(div1, hr);
    			append_dev(div3, t10);
    			append_dev(div3, img);
    			append_dev(div3, t11);
    			append_dev(div3, div2);
    			append_dev(div2, h50);
    			append_dev(div2, t13);
    			append_dev(div2, h30);
    			append_dev(div2, t15);
    			append_dev(div2, p0);
    			append_dev(div2, t17);
    			append_dev(div2, a);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div5, h51);
    			append_dev(div5, t21);
    			append_dev(div5, h31);
    			append_dev(div5, t23);
    			append_dev(div5, p1);
    			append_dev(div7, t25);
    			append_dev(div7, div6);
    			append_dev(div6, h52);
    			append_dev(div6, t27);
    			append_dev(div6, h32);
    			append_dev(div6, t29);
    			append_dev(div6, p2);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(li0, "click", /*toggleActive*/ ctx[0], false, false, false),
    				listen_dev(li1, "click", /*toggleActive*/ ctx[0], false, false, false),
    				listen_dev(li2, "click", /*toggleActive*/ ctx[0], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(section1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const toggleActive = () => {
    		let activeElements = document.getElementsByClassName("active");
    		activeElements[0].classList.remove("active");
    		let element = event.path[1];
    		element.classList.add("active");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ toggleActive });
    	return [toggleActive];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
