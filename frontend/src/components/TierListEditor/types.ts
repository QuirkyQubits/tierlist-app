export type Card = {
    id: string;
    src: string;
    name: string;
};

export type Tier = {
    id: string;
    label: string;
    color: string;
    items: Card[];
    isUnsorted: boolean;
};
