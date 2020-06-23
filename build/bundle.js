
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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
    	let section0;
    	let div3;
    	let div2;
    	let div0;
    	let h10;
    	let t1;
    	let h11;
    	let t3;
    	let hr;
    	let t4;
    	let img;
    	let img_src_value;
    	let t5;
    	let div1;
    	let h5;
    	let t7;
    	let h3;
    	let t9;
    	let p;
    	let t11;
    	let a;
    	let t13;
    	let section1;
    	let t14;
    	let section2;
    	let div10;
    	let div7;
    	let div4;
    	let i0;
    	let t16;
    	let br0;
    	let t17;
    	let span0;
    	let t19;
    	let div5;
    	let t20;
    	let div6;
    	let t21;
    	let h12;
    	let t23;
    	let div9;
    	let div8;
    	let table;
    	let tr0;
    	let td0;
    	let i1;
    	let t25;
    	let td1;
    	let b0;
    	let br1;
    	let span1;
    	let t28;
    	let tr1;
    	let td2;
    	let i2;
    	let t30;
    	let td3;
    	let b1;
    	let br2;
    	let span2;
    	let t33;
    	let tr2;
    	let td4;
    	let i3;
    	let t35;
    	let td5;
    	let b2;
    	let br3;
    	let span3;

    	const block = {
    		c: function create() {
    			section0 = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Dharmil";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "Parekh";
    			t3 = space();
    			hr = element("hr");
    			t4 = space();
    			img = element("img");
    			t5 = space();
    			div1 = element("div");
    			h5 = element("h5");
    			h5.textContent = "-Introduction";
    			t7 = space();
    			h3 = element("h3");
    			h3.textContent = "Full Stack Developer based in India";
    			t9 = space();
    			p = element("p");
    			p.textContent = "Innovative optimized solution seeker. Excited to be at the development phase of my new career as a web developer. I am ambitious, adventurous and assiduos.";
    			t11 = space();
    			a = element("a");
    			a.textContent = "For More Info";
    			t13 = space();
    			section1 = element("section");
    			t14 = space();
    			section2 = element("section");
    			div10 = element("div");
    			div7 = element("div");
    			div4 = element("div");
    			i0 = element("i");
    			i0.textContent = "edit";
    			t16 = space();
    			br0 = element("br");
    			t17 = space();
    			span0 = element("span");
    			span0.textContent = "Frontend Developer";
    			t19 = space();
    			div5 = element("div");
    			t20 = space();
    			div6 = element("div");
    			t21 = space();
    			h12 = element("h1");
    			h12.textContent = "Contact Me";
    			t23 = space();
    			div9 = element("div");
    			div8 = element("div");
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			i1 = element("i");
    			i1.textContent = "home";
    			t25 = space();
    			td1 = element("td");
    			b0 = element("b");
    			b0.textContent = "Home ";
    			br1 = element("br");
    			span1 = element("span");
    			span1.textContent = "603,Satyam, Vasant Complex, Mahavir Nagar, Kandivali(W), Mumbai-67";
    			t28 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			i2 = element("i");
    			i2.textContent = "phone";
    			t30 = space();
    			td3 = element("td");
    			b1 = element("b");
    			b1.textContent = "Phone ";
    			br2 = element("br");
    			span2 = element("span");
    			span2.textContent = "+91 7718924436";
    			t33 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			i3 = element("i");
    			i3.textContent = "email";
    			t35 = space();
    			td5 = element("td");
    			b2 = element("b");
    			b2.textContent = "Email";
    			br3 = element("br");
    			span3 = element("span");
    			span3.textContent = "dharmilp03@gmail.com";
    			attr_dev(h10, "class", "svelte-11592fj");
    			add_location(h10, file, 181, 8, 2970);
    			attr_dev(h11, "class", "svelte-11592fj");
    			add_location(h11, file, 182, 8, 2995);
    			attr_dev(hr, "class", "svelte-11592fj");
    			add_location(hr, file, 183, 2, 3013);
    			attr_dev(div0, "class", "name svelte-11592fj");
    			add_location(div0, file, 180, 6, 2943);
    			if (img.src !== (img_src_value = "./profpic.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "350px");
    			attr_dev(img, "class", "svelte-11592fj");
    			add_location(img, file, 185, 6, 3037);
    			attr_dev(h5, "class", "svelte-11592fj");
    			add_location(h5, file, 187, 8, 3110);
    			attr_dev(h3, "class", "svelte-11592fj");
    			add_location(h3, file, 188, 8, 3141);
    			attr_dev(p, "class", "svelte-11592fj");
    			add_location(p, file, 189, 8, 3194);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-11592fj");
    			add_location(a, file, 192, 2, 3379);
    			attr_dev(div1, "class", "info svelte-11592fj");
    			add_location(div1, file, 186, 6, 3083);
    			attr_dev(div2, "class", "banner svelte-11592fj");
    			add_location(div2, file, 179, 4, 2916);
    			attr_dev(div3, "class", "container svelte-11592fj");
    			add_location(div3, file, 178, 2, 2888);
    			attr_dev(section0, "id", "name");
    			attr_dev(section0, "class", "svelte-11592fj");
    			add_location(section0, file, 177, 0, 2866);
    			attr_dev(section1, "class", "bg-gray svelte-11592fj");
    			add_location(section1, file, 197, 0, 3453);
    			attr_dev(i0, "class", "material-icons m-20 svelte-11592fj");
    			set_style(i0, "font-size", "30px");
    			add_location(i0, file, 205, 8, 3600);
    			add_location(br0, file, 206, 8, 3674);
    			attr_dev(span0, "class", "svelte-11592fj");
    			add_location(span0, file, 207, 8, 3687);
    			attr_dev(div4, "class", "card svelte-11592fj");
    			add_location(div4, file, 204, 6, 3573);
    			attr_dev(div5, "class", "card svelte-11592fj");
    			add_location(div5, file, 209, 6, 3738);
    			attr_dev(div6, "class", "card svelte-11592fj");
    			add_location(div6, file, 212, 6, 3785);
    			attr_dev(div7, "class", "row svelte-11592fj");
    			add_location(div7, file, 203, 4, 3549);
    			attr_dev(h12, "class", "t-c svelte-11592fj");
    			add_location(h12, file, 216, 4, 3841);
    			attr_dev(i1, "class", "material-icons fc-purple fs-40 md-48 svelte-11592fj");
    			add_location(i1, file, 223, 12, 3987);
    			attr_dev(td0, "class", "svelte-11592fj");
    			add_location(td0, file, 222, 10, 3970);
    			add_location(b0, file, 226, 12, 4087);
    			add_location(br1, file, 226, 24, 4099);
    			add_location(span1, file, 226, 28, 4103);
    			attr_dev(td1, "class", "svelte-11592fj");
    			add_location(td1, file, 225, 10, 4070);
    			add_location(tr0, file, 221, 8, 3955);
    			attr_dev(i2, "class", "material-icons fc-purple fs-40 md-48 svelte-11592fj");
    			add_location(i2, file, 231, 12, 4253);
    			attr_dev(td2, "class", "svelte-11592fj");
    			add_location(td2, file, 230, 10, 4236);
    			add_location(b1, file, 234, 12, 4354);
    			add_location(br2, file, 234, 25, 4367);
    			add_location(span2, file, 234, 29, 4371);
    			attr_dev(td3, "class", "svelte-11592fj");
    			add_location(td3, file, 233, 10, 4337);
    			add_location(tr1, file, 229, 8, 4221);
    			attr_dev(i3, "class", "material-icons fc-purple fs-40 md-48 svelte-11592fj");
    			add_location(i3, file, 239, 12, 4469);
    			attr_dev(td4, "class", "svelte-11592fj");
    			add_location(td4, file, 238, 10, 4452);
    			add_location(b2, file, 242, 12, 4570);
    			add_location(br3, file, 242, 24, 4582);
    			add_location(span3, file, 242, 28, 4586);
    			attr_dev(td5, "class", "svelte-11592fj");
    			add_location(td5, file, 241, 10, 4553);
    			add_location(tr2, file, 237, 8, 4437);
    			add_location(table, file, 220, 6, 3939);
    			attr_dev(div8, "class", "bordered-box svelte-11592fj");
    			add_location(div8, file, 219, 6, 3906);
    			attr_dev(div9, "class", "row svelte-11592fj");
    			add_location(div9, file, 217, 4, 3877);
    			attr_dev(div10, "class", "container svelte-11592fj");
    			add_location(div10, file, 202, 2, 3521);
    			attr_dev(section2, "id", "contactus");
    			attr_dev(section2, "class", "svelte-11592fj");
    			add_location(section2, file, 200, 0, 3491);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section0, anchor);
    			append_dev(section0, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h10);
    			append_dev(div0, t1);
    			append_dev(div0, h11);
    			append_dev(div0, t3);
    			append_dev(div0, hr);
    			append_dev(div2, t4);
    			append_dev(div2, img);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, h5);
    			append_dev(div1, t7);
    			append_dev(div1, h3);
    			append_dev(div1, t9);
    			append_dev(div1, p);
    			append_dev(div1, t11);
    			append_dev(div1, a);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, section1, anchor);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, div10);
    			append_dev(div10, div7);
    			append_dev(div7, div4);
    			append_dev(div4, i0);
    			append_dev(div4, t16);
    			append_dev(div4, br0);
    			append_dev(div4, t17);
    			append_dev(div4, span0);
    			append_dev(div7, t19);
    			append_dev(div7, div5);
    			append_dev(div7, t20);
    			append_dev(div7, div6);
    			append_dev(div10, t21);
    			append_dev(div10, h12);
    			append_dev(div10, t23);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, table);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, i1);
    			append_dev(tr0, t25);
    			append_dev(tr0, td1);
    			append_dev(td1, b0);
    			append_dev(td1, br1);
    			append_dev(td1, span1);
    			append_dev(table, t28);
    			append_dev(table, tr1);
    			append_dev(tr1, td2);
    			append_dev(td2, i2);
    			append_dev(tr1, t30);
    			append_dev(tr1, td3);
    			append_dev(td3, b1);
    			append_dev(td3, br2);
    			append_dev(td3, span2);
    			append_dev(table, t33);
    			append_dev(table, tr2);
    			append_dev(tr2, td4);
    			append_dev(td4, i3);
    			append_dev(tr2, t35);
    			append_dev(tr2, td5);
    			append_dev(td5, b2);
    			append_dev(td5, br3);
    			append_dev(td5, span3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(section1);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(section2);
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
    	return [];
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
