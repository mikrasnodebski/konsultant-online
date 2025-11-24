export type Offer = {
  id: number;
  storeSlug: string;
  title: string;
  descriptionHtml: string;
  pricePln: number;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};


