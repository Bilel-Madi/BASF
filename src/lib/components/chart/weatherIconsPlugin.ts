// weatherIconsPlugin.ts

import chartjs, { Chart } from 'chart.js/auto';

interface WeatherIconPluginOptions {
    sunnyIconPath: string;
    partlyIconPath: string;
}

const weatherIconsPlugin = {
    id: 'weatherIcons',
    icons: [] as HTMLImageElement[],

    loadImages(sunnyIconPath: string, partlyIconPath: string): Promise<HTMLImageElement[]> {
        const loadImage = (src: string) => {
            const image = new Image();
            image.src = src;
            return new Promise<HTMLImageElement>((resolve) => {
                image.onload = () => resolve(image);
            });
        };

        return Promise.all([
            loadImage(sunnyIconPath),
            loadImage(partlyIconPath)
        ]);
    },

    async initializeIcons(chart: Chart, tickPositions: number[], options: WeatherIconPluginOptions) {
        const [sunnyIcon, partlyIcon] = await this.loadImages(options.sunnyIconPath, options.partlyIconPath);
        this.icons = tickPositions.map((_, index) => {
            if (index < tickPositions.length - 1) {
                return Math.random() < 0.5 ? sunnyIcon : partlyIcon;
            }
            return null;
        });
    },

    afterDraw(chart: Chart) {
        const { ctx, chartArea, scales } = chart;
        const x = scales.x;
        const { bottom } = chartArea;
        const tickPositions = x.ticks.map((tick) => x.getPixelForValue(tick.value));

        if (this.icons.length === 0) {
            this.initializeIcons(chart, tickPositions, { sunnyIconPath: '/sunny.png', partlyIconPath: '/partly.png' }).then(() => {
                this.redrawIcons(chart);
            });
            return;
        }

        this.redrawIcons(chart);
    },

    redrawIcons(chart: Chart) {
        const { ctx, chartArea, scales } = chart;
        const x = scales.x;
        const { bottom } = chartArea;
        const tickPositions = x.ticks.map((tick) => x.getPixelForValue(tick.value));

        tickPositions.forEach((pos, index) => {
            if (index < tickPositions.length - 1 && this.icons[index]) {
                const centerPos = (pos + tickPositions[index + 1]) / 2;
                const weatherIcon = this.icons[index];
                const iconSize = 20;
                const iconYPos = bottom - 230;
                const scale = iconSize / weatherIcon.width;
                const scaledWidth = weatherIcon.width * scale;
                const scaledHeight = weatherIcon.height * scale;

                ctx.drawImage(
                    weatherIcon,
                    centerPos - scaledWidth / 2,
                    iconYPos - scaledHeight,
                    scaledWidth,
                    scaledHeight
                );
            }
        });
    }
};

export default weatherIconsPlugin;
