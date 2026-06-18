'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Soul } from '@/types/soul';

export function PersonalityRadar({ soul, size = 280 }: { soul: Soul; size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !soul.personality.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const totalSize = size;
    const radius = totalSize / 2 - 30;
    const center = totalSize / 2;

    const g = svg.append('g').attr('transform', `translate(${center}, ${center})`);

    const dimensions = soul.personality.map(p => p.name);
    const values = soul.personality.map(p => p.value);

    const angleScale = d3.scaleLinear()
      .domain([0, dimensions.length])
      .range([0, 2 * Math.PI]);

    const radiusScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);

    // Background rings (subtle)
    [25, 50, 75, 100].forEach(r => {
      g.append('circle')
        .attr('r', radiusScale(r))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(232, 230, 225, 0.04)')
        .attr('stroke-width', 1);
    });

    // Axes
    dimensions.forEach((dim, i) => {
      const angle = angleScale(i) - Math.PI / 2;
      const x2 = Math.cos(angle) * radius;
      const y2 = Math.sin(angle) * radius;

      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', 'rgba(232, 230, 225, 0.06)')
        .attr('stroke-width', 1);

      // Label
      const labelX = Math.cos(angle) * (radius + 18);
      const labelY = Math.sin(angle) * (radius + 18);
      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-family', 'Inter, sans-serif')
        .attr('font-weight', '500')
        .attr('letter-spacing', '0.1em')
        .style('opacity', 0.85)
        .text(dim.toUpperCase());
    });

    // Personality shape
    const lineGenerator = d3.lineRadial()
      .angle((d, i) => angleScale(i))
      .radius(d => radiusScale(d as number))
      .curve(d3.curveCardinalClosed);

    const pathData = lineGenerator(values as unknown as number[]);

    // Animate draw
    const path = g.append('path')
      .attr('d', pathData || '')
      .attr('fill', 'rgba(212, 165, 116, 0.10)')
      .attr('stroke', 'var(--amber)')
      .attr('stroke-width', 1.2)
      .attr('stroke-opacity', 0.8);

    const totalLength = (path.node() as SVGPathElement)?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeCubicInOut)
      .attr('stroke-dashoffset', 0);

    // Dots at each vertex
    dimensions.forEach((_, i) => {
      const angle = angleScale(i) - Math.PI / 2;
      const r = radiusScale(values[i]);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 0)
        .attr('fill', 'var(--amber)')
        .transition()
        .delay(2000 + i * 80)
        .duration(300)
        .attr('r', 2);
    });
  }, [soul, size]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{
        display: 'block',
        margin: '0 auto',
        filter: 'drop-shadow(0 0 12px rgba(212, 165, 116, 0.1))',
      }}
    />
  );
}
