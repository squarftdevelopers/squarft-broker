import { createSlice } from '@reduxjs/toolkit';

const toTitleCase = (value = '') => value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

const formatArea = (unit = {}) => {
    if (!unit.area) return '';
    return `${unit.area} ${unit.areaUnit || 'Sq-ft'}`;
};

const formatPrice = (value) => {
    const numeric = Number(String(value || '').replace(/[^0-9.]/g, ''));
    if (!numeric) return '';
    if (numeric >= 10000000) return `₹${(numeric / 10000000).toFixed(numeric % 10000000 === 0 ? 0 : 2)} Cr`;
    if (numeric >= 100000) return `₹${(numeric / 100000).toFixed(numeric % 100000 === 0 ? 0 : 2)} L`;
    return `₹${numeric.toLocaleString('en-IN')}`;
};

const getUnitTitle = (type = {}, unit = {}) => {
    if (unit.bhk) return unit.bhk;
    if (unit.officeType) return unit.officeType;
    return toTitleCase(type.subType || type.mainType || 'Property');
};

const getUnitPrice = (unit = {}) => formatPrice(unit.price || unit.sellingPrice || unit.customPrice) || '';

const makeInventoryUnit = (type, unit, index) => ({
    id: unit.propertyNumber || unit.unitId || `${toTitleCase(type.subType)}-${index + 1}`,
    status: unit.status || 'Available',
    title: getUnitTitle(type, unit),
    price: getUnitPrice(unit),
    area: formatArea(unit),
    images: (unit.images || []).map((image) => typeof image === 'string' ? { uri: image } : image),
    amenities: (unit.amenities || []).filter(Boolean),
    possession: unit.possession,
    avgPricePerSqft: unit.avgPricePerSqft,
    ctaLabel: 'BLOCK',
    ctaVariant: 'primary',
    actionIcon: 'edit',
    dimmed: unit.status === 'Sold',
});

const groupBy = (items, getKey) => items.reduce((acc, item) => {
    const key = getKey(item) || 'default';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
}, {});

const buildInventory = (selectedTypes = []) => {
    const inventory = {};

    selectedTypes.forEach((type) => {
        const subType = type.subType || type.id;
        const units = type.units || [];
        if (!units.length) return;

        if (subType === 'apartment') {
            const byTower = groupBy(units, unit => unit.tower || 'Tower A');
            inventory.apartment = {
                towers: Object.entries(byTower).map(([towerName, towerUnits], towerIndex) => {
                    const byFloor = groupBy(towerUnits, unit => unit.floor || unit.row || '1');
                    return {
                        key: `tower-${towerIndex + 1}`,
                        label: towerName,
                        sections: Object.entries(byFloor).map(([floor, floorUnits]) => ({
                            rowLabel: `FLOOR ${floor}`,
                            units: floorUnits.map((unit, index) => makeInventoryUnit(type, unit, index)),
                        })),
                    };
                }),
            };
            return;
        }

        if (subType === 'plot') {
            const bySection = groupBy(units, unit => unit.tower || unit.sectionId || 'Stack A');
            inventory.plot = {
                stacks: Object.entries(bySection).map(([sectionName, sectionUnits], sectionIndex) => {
                    const byLevel = groupBy(sectionUnits, unit => unit.row || unit.floor || '1');
                    return {
                        key: `stack-${sectionIndex + 1}`,
                        label: sectionName,
                        levels: Object.entries(byLevel).map(([level, levelUnits]) => ({
                            level,
                            cards: levelUnits.map((unit, index) => ({
                                unit: unit.propertyNumber || unit.unitId || `Plot-${index + 1}`,
                                meta: `${toTitleCase(subType)} • ${formatArea(unit) || '-'}`,
                                price: getUnitPrice(unit),
                                status: unit.status || 'Available',
                                active: index === 0,
                                icon: unit.status === 'Sold' ? 'lock-closed' : unit.status === 'Booked' ? 'hourglass-outline' : 'checkmark-circle',
                                area: formatArea(unit),
                                images: (unit.images || []).map((image) => typeof image === 'string' ? { uri: image } : image),
                                amenities: (unit.amenities || []).filter(Boolean),
                            })),
                        })),
                    };
                }),
            };
            return;
        }

        const sectionLabel = subType === 'shop' || subType === 'showroom' ? 'SECTION 1' : 'ROW 1';
        inventory[subType] = {
            sections: [
                {
                    rowLabel: sectionLabel,
                    units: units.map((unit, index) => makeInventoryUnit(type, unit, index)),
                },
            ],
        };
    });

    return inventory;
};

const flattenInventoryUnits = (inventory = {}) => {
    const units = [];
    Object.entries(inventory).forEach(([key, data]) => {
        if (key === 'apartment') {
            data.towers?.forEach(tower => tower.sections?.forEach(section => units.push(...(section.units || []))));
        } else if (key === 'plot') {
            data.stacks?.forEach(stack => stack.levels?.forEach(level => units.push(...(level.cards || []).map(card => ({
                status: card.status,
                price: card.price,
                area: card.area,
                title: card.meta,
            })))));
        } else {
            data.sections?.forEach(section => units.push(...(section.units || [])));
        }
    });
    return units;
};

const buildUnitsSummary = (inventory) => {
    const units = flattenInventoryUnits(inventory);
    return {
        total: units.length,
        avail: units.filter(unit => unit.status === 'Available').length,
        sold: units.filter(unit => unit.status === 'Sold').length,
        booked: units.filter(unit => unit.status === 'Booked').length,
        token: units.filter(unit => unit.status === 'Token').length,
    };
};

const buildApartmentSummary = (selectedTypes = []) => selectedTypes.map((type) => {
    const units = type.units || [];
    const prices = units.map(unit => getUnitPrice(unit)).filter(Boolean);
    return {
        type: toTitleCase(type.subType || type.mainType || 'Property'),
        price: prices[0] || 'Price not added',
    };
});

const normalizeProject = (project) => {
    if (project.title && project.inventory) {
        const media = project.projectMediaAndSubmission || {};
        return {
            ...project,
            units: buildUnitsSummary(project.inventory),
            imagesCount: project.imagesCount || `${media.images?.length || project.projectImages?.length || 0} Photos`,
        };
    }

    const inventory = buildInventory(project.selectedTypes || []);
    const firstUnit = flattenInventoryUnits(inventory)[0] || {};
    const media = project.projectMediaAndSubmission || {};
    const approvals = project.legalApprovalsAndStatus || {};
    const finance = project.financeGuidelineOwnership || {};
    const reraStatus = approvals.approvals?.rera?.status;

    return {
        ...project,
        title: project.projectName || 'Untitled Project',
        location: [project.location, project.city, project.state].filter(Boolean).join(', '),
        developer: project.responsiblePersonName || project.salesOfficerName || 'Builder details pending',
        possession: approvals.expectedPossessionDate || approvals.possessionStatus || 'Not updated',
        avgPrice: finance.guidelineValueAmount
            ? `${formatPrice(finance.guidelineValueAmount)} ${finance.guidelineValueUnit || ''}`.trim()
            : firstUnit.price || 'Not updated',
        rera: reraStatus === 'Yes',
        apartments: buildApartmentSummary(project.selectedTypes || []),
        units: buildUnitsSummary(inventory),
        imagesCount: `${media.images?.length || 0} Photos`,
        projectImages: media.images || [],
        projectDocuments: media.documents || [],
        visits: project.visits || { metrics: [], pipeline: { stages: [] }, followUps: [] },
        deals: project.deals || [],
        amenities: Array.from(new Set((project.selectedTypes || []).flatMap(type => (type.units || []).flatMap(unit => unit.amenities || [])))).filter(Boolean),
        inventory,
    };
};

const initialState = {
    projects: [],
};

const projectsSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
        addProject: (state, action) => {
            state.projects.unshift(normalizeProject(action.payload));
        },
        updateProject: (state, action) => {
            const index = state.projects.findIndex(project => project.id === action.payload.id);
            if (index !== -1) {
                state.projects[index] = normalizeProject({
                    ...state.projects[index],
                    ...action.payload,
                });
            }
        },
        clearProjects: (state) => {
            state.projects = [];
        },
    },
});

export const { addProject, updateProject, clearProjects } = projectsSlice.actions;
export default projectsSlice.reducer;
