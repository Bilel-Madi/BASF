
export function createGradients(ctx, colors) {
    const blueGradient = ctx.createLinearGradient(0, 25, 0, 200);
    blueGradient.addColorStop(0, colors.blue.half);
    blueGradient.addColorStop(0.20, colors.blue.quarter);
    blueGradient.addColorStop(0.60, colors.blue.zero);

    const orangeGradient = ctx.createLinearGradient(0, 25, 0, 300);
    orangeGradient.addColorStop(0, colors.orange.half);
    orangeGradient.addColorStop(0.35, colors.orange.quarter);
    orangeGradient.addColorStop(1, colors.orange.zero);

    return { blueGradient, orangeGradient };
}
