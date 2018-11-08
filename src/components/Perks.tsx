import * as React from 'react';
import * as d3 from 'd3';
import * as _ from 'lodash';
import {autobind} from "core-decorators";

interface PerkDatum {
    children: PerkDatum[]; // Children perk
    click: number; // Placement around parent
    cx?: number; // The screen coordinates of the node, if rendered
    cy?: number; // ^
    depth: number; // How many layers removed from the center, used for size
    description: string; // Description
    g?: any; // The reference to the d3 container
    name: string; // Name displayed
    node?: any; // A reference to the d3 circle
    totalClick?: number; // The click counting its parents and the base click
    text?: any; // A reference to the d3 text
}

interface DocData {
    data: PerkDatum;
    maxDepth: number;
    nodeShrinkRatio: number;
    outerRingRatio: number;
    ringShrinkRatio: number;
}

interface IState {
    hoverPerk: PerkDatum;
}

const NODE_RADIUS: number = 70;
const TRANSITION_MS: number = 1000;
const EASE = Math.sqrt;

@autobind
export default class Perks extends React.Component<any, IState> {
    click: number = 4;
    depth: number = 0;
    doc: DocData;
    w: number;
    h: number;
    g: any = null;
    ringRatios: number[] = [];
    root: any = null;

    constructor(props) {
        super(props);
        this.state = {
            hoverPerk: null,
        };
    }

    componentDidMount() {
        this.getData();
    }

    mouseenter(d: PerkDatum) {
        const event = d3.event;
        const content: string = `<div><p>${d.description}</p></div>`;
        d3.select('#tooltip')
            .style('display', 'inline-block')
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY) + 'px')
            .html(content);
    }

    mousemove() {
        const event = d3.event;
        d3.select('#tooltip')
            .style('display', 'inline-block')
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY) + 'px');
    }

    mouseleave() {
        d3.select('#tooltip').style('display', 'none');
    }

    resetNode(child: PerkDatum, parent: PerkDatum) {
        const distRatio: number = this.ringRatios[child.depth - this.depth] - this.ringRatios[parent.depth - this.depth];
        child.totalClick = parent.totalClick + child.click;
        child.cx = parent.cx;
        child.cy = parent.cy - this.h * distRatio / 2;
        if (!!document.getElementById(`${child.name}`)) {
            this.g.selectAll(`#${child.name}`).transition().duration(TRANSITION_MS)
                .ease(EASE)
                .attr('r', NODE_RADIUS / Math.pow(this.doc.nodeShrinkRatio, child.depth - this.depth))
                .style('transform-origin', `${parent.cx}px ${parent.cy}px`);
            child.node.transition().duration(TRANSITION_MS)
                .ease(EASE)
                .attr('r', NODE_RADIUS / Math.pow(this.doc.nodeShrinkRatio, child.depth - this.depth))
                .attr('cx', child.cx)
                .attr('cy', child.cy);
            child.text.transition().duration(TRANSITION_MS)
                .ease(EASE)
                .attr('x', child.cx)
                .attr('y', child.cy);
        } else {
            this.setupNode(child, parent);
        }
    }

    resetChildren(parent: PerkDatum) {
        _.forEach(parent.children, (child: PerkDatum) => {
            this.resetNode(child, parent);
            if (child.depth - this.depth < this.doc.maxDepth) {
                this.resetChildren(child);
            }
        });
    }

    resetRoot(d: PerkDatum) {
        d.g.transition().duration(TRANSITION_MS)
            .ease(EASE)
            .style('transform', 'rotate(0deg)')
            .style('transform-origin', `${this.root.cx}px ${this.root.cy}px`);
        d.cx = this.root.cx;
        d.cy = this.root.cy;
        this.root = d;
        this.depth = d.depth;
        d.node.transition().duration(TRANSITION_MS)
            .ease(EASE)
            .attr('r', NODE_RADIUS)
            .attr('cx', d.cx)
            .attr('cy', d.cy);
        d.text.transition().duration(TRANSITION_MS)
            .ease(EASE)
            .attr('x', d.cx)
            .attr('y', d.cy);
    }

    onClick(d: PerkDatum) {
        d3.select('#canvas').selectAll('*').remove();
        this.g = d3.select('#canvas').append('g');
        this.g.node().appendChild(d.g.node());
        d.g.node().appendChild(d.node.node());
        d.g.node().appendChild(d.text.node());
        this.setupChildren(d);
        this.resetRoot(d);
        this.resetChildren(d);
    }

    setupCanvas() {
        const bcr = document.getElementById('canvas').getBoundingClientRect();
        this.w = bcr.width;
        this.h = bcr.height;
        d3.select('#canvas').selectAll('*').remove();
        this.g = d3.select('#canvas').append('g');
    }

    setupRoot() {
        this.root = this.doc.data;
        this.root.totalClick = 0;
        this.root.cx = this.w / 2;
        this.root.cy = this.h / 2;
        this.root.g = this.g.selectAll(`#${this.root.name}`).data([this.doc.data]).enter()
            .append('g')
            .attr('id', 'root');
        this.root.node = this.root.g.selectAll(`#${this.root.name}-circle`)
            .data([this.doc.data])
            .enter()
            .append('circle')
            .attr('id', `${this.root.name}-circle`)
            .attr('r', NODE_RADIUS)
            .attr('cx', this.root.cx)
            .attr('cy', this.root.cy);
        this.root.text = this.root.g.selectAll(`#${this.root.name}-text`)
            .data([this.doc.data])
            .enter()
            .append('text')
            .attr('id', `#${this.root.name}-text`)
            .text(this.root.name)
            .attr('x', this.root.cx)
            .attr('y', this.root.cy);
        this.root.node.on('mouseenter', this.mouseenter)
            .on('mousemove', this.mousemove)
            .on('mouseleave', this.mouseleave)
            .on('click', this.onClick);
    }

    setupRings() {
        const { outerRingRatio, maxDepth, ringShrinkRatio } = this.doc;
        const range: number[] = _.range(maxDepth);
        const firstRing: number = outerRingRatio / _.sum(_.map(range,
            (pow) => 1 / Math.pow(ringShrinkRatio, pow)));
        let totalRatio: number = 0;
        let currentRatio: number = firstRing;
        this.ringRatios = _.map(range, () => {
            totalRatio += currentRatio;
            currentRatio /= ringShrinkRatio;
            return totalRatio;
        });
        this.ringRatios.unshift(0);
    }

    setupNode(child: PerkDatum, parent: PerkDatum) {
        const distRatio: number = this.ringRatios[child.depth - this.depth] - this.ringRatios[parent.depth - this.depth];
        child.cx = parent.cx;
        child.cy = parent.cy - this.h * distRatio/ 2;
        child.g = parent.g.selectAll(`#${child.name}`).data([child]).enter()
            .append('g')
            .attr('id', child.name)
            .style('transform-origin', `${parent.cx}px ${parent.cy}px`)
            .style('transform', `rotate(${30 * child.click}deg)`);
        child.node = child.g.selectAll(`#${child.name}-circle`)
            .data([child])
            .enter()
            .append('circle')
            .attr('id', `${child.name}-circle`)
            .attr('r', NODE_RADIUS / Math.pow(this.doc.nodeShrinkRatio, child.depth - this.depth))
            .attr('cx', child.cx)
            .attr('cy', child.cy);
        child.text = child.g.selectAll(`#${child.name}-text`)
            .data([child])
            .enter()
            .append('text')
            .attr('id', `${child.name}-text`)
            .text(child.name)
            .attr('x', child.cx)
            .attr('y', child.cy);
        child.node.on('mouseenter', this.mouseenter)
            .on('mousemove', this.mousemove)
            .on('mouseleave', this.mouseleave)
            .on('click', this.onClick);
    }

    setupChildren(parent: PerkDatum) {
        _.forEach(parent.children, (child: PerkDatum) => {
            this.setupNode(child, parent);
            if (child.depth - this.depth < this.doc.maxDepth) {
                this.setupChildren(child);
            }
        })
    }

    handleResponse(response: DocData) {
        this.doc = response;
        this.setupCanvas();
        this.setupRings();
        this.setupRoot();
        this.setupChildren(this.root);
    }

    getData(): void {
        fetch('./perks.json')
        .then((raw) => raw.json())
        .then((response) => this.handleResponse(response));
    }

    render() {
        return (
            <div id="perks">
                <svg id="canvas" />
                <div id="tooltip" />
            </div>
        );
    }
}
