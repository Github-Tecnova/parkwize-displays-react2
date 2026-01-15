export function formatCAD(amount: number): string {
    return amount.toLocaleString("en-CA", {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function calculateDynamicField(
    fields: any[],
    occupancyPercent: number,
): number {
    let final = 0;
    for (const price of fields) {
        if (occupancyPercent >= price.percent) {
            final = price.pricing;
            break;
        }
    }

    return final;
}

export function calculateFieldValue(
    occupancyPercent: number,
    pricingType: any,
    pricing: number | any[],
) {
    if (pricingType === "DYNAMIC") {
        return calculateDynamicField(
            pricing as any[],
            occupancyPercent,
        );
    }
    return pricing as number;
}

export const formatDuration2 = (totalMinutes: number): string => {
    if (isNaN(totalMinutes)) return "0m";

    if (totalMinutes < 60) return `${totalMinutes}m`;

    return `${Math.floor(totalMinutes / 60)}h`;
};