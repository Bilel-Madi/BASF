// horizontalCrosshairPlugin.ts



const horizontalCrosshairPlugin = {
    id: 'horizontalCrosshair',
    beforeEvent(chart: Chart, args: { event: MouseEvent }) {
        chart['crosshairY'] = args.event.y;
        
    },
    beforeDraw(chart: Chart) {
        const {ctx, chartArea, crosshairY} = chart as any; // Adjust type casting as needed
        const {top, bottom, left, right}: ChartArea = chartArea;

        if (crosshairY < top || crosshairY > bottom) {
            return; // Do not draw if the y-position is outside the chart area
        }

        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#FF0000'; // Customize the crosshair line color here
        ctx.setLineDash([5, 5]); // Optionally, create a dashed line effect
        ctx.moveTo(left, crosshairY);
        ctx.lineTo(right, crosshairY);
        ctx.stroke();
        ctx.restore();
    }
};

export default horizontalCrosshairPlugin;
