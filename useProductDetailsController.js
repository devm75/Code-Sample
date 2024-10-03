import constants from "@/constants";
import { ONLINE_DELIVERY_STORE_ID, STORE_ID } from "@/constants/keys";
import useDeviceWidth from "@/hooks/useDeviceWidth";
import useEffectOnce from "@/hooks/useEffectOnce";
import useHandleApiError from "@/hooks/useHandleApiError";
import useIsMobile from "@/hooks/useIsMobile";
import useTrolleyUtility from "@/hooks/useTrolleyUtility";
import useWishlistUtility from "@/hooks/useWishlistUtility";
import { getPlacementForPDP } from "@/services/algonomy";
import { itemViewPdpG4AAnalytics } from "@/services/gtm";
import { useGetProductStockStatus } from "@/services/product";

import { useAppSelector } from "@/store";
import {
    customOffersSplit,
    getMinPrice,
    getPORAndPORPercent,
    getPdpProductDetails,
    getStockLevel,
    getTierPrice,
    getTierPriceAndQuantity,
    handleToastError,
    parseMagentoErrorMessage,
    productDeleteMessage,
} from "@/utils";
import useTranslation from "next-translate/useTranslation";
import { useState } from "react";
export const useProductDetailsController = (props) => {
    let {
        name,
        id,
        price,
        sku,
        status,
        weight,
        custom_attributes,
        media_gallery_entries: images,
        tier_prices: tierPricesArray,
        url,
        extension_attributes,
    } = props.data;
    let parsedLabels;
    try {
        parsedLabels = extension_attributes?.product_label?.map((ele) =>
            JSON.parse(ele)
        );
    } catch (error) {
        console.log(error);
    }

    const { t } = useTranslation("common");
    const deviceWidth = useDeviceWidth();
    const selectedStoreId = useAppSelector(
        (state) => state.checkout.selectedStoreId
    );
    useHandleApiError(false, false, props?.productError);
    const [taxRate, setTaxRate] = useState(0);
    const [maxSaleQty, setMaxSaleQty] = useState(0);
    const [productSource, setProductSource] = useState([]);
    const [deliveryAvailable, setDeliveryAvailable] = useState(true);
    const [clickAndCollectAvailable, setClickAndCollectAvailable] =
        useState(true);
    const isMobile = useIsMobile();
    const [algonomyPlacement, setAlgonomyPlacement] = useState(null);

    const customer = useAppSelector((state) => state.customer.details);
    const customerLoading = useAppSelector((state) => state.customer.loading);

    const favouriteProducts = useAppSelector((state) => state.favourites.data);

    const [mobileInfoDietaryClickedKey, setMobileInfoDietaryClickedKey] =
        useState({ value: "0" });
    const [taxLoading, setTaxLoading] = useState(false);
    // Mobile view dietary icons >4 click on info icon this function runs.
    const handleDietaryInfoClick = () => {
        setMobileInfoDietaryClickedKey((prev) => ({ value: "4" }));
        const scrollEndElement = document.getElementById("dietary-accordian");
        scrollEndElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
        });
    };

    let isProductFavourite =
        favouriteProducts?.total > 0 && favouriteProducts?.list?.includes(id);

    // converting attributes from an array of objects to object of key-value pairs
    const customAttributesModified = custom_attributes?.reduce(
        (acc, ele) => ({ ...acc, [ele?.attribute_code]: ele?.value }),
        {}
    );

    let {
        meta_title: metaTitle,
        meta_description: metaDescription,
        short_description: shortDescription,
        pack_size: packSize,
        rrp,
        special_offer_text: specialOffers,
        energy_kj: energyKj,
        energy_kcal: energyKcal,
        fat,
        per100g,
        of_which_saturates: saturatesInFat,
        carbohydrates,
        of_which_sugars: sugarsInCarbs,
        protein,
        fibre,
        salt,
        dietary,
        per_piece: perPiece,
        unit_quantity: unitQuantity,
        pos_mode_type: deliveryMode,
        special_price: specialPrice,
        stock_level: stockLevelStatus,
    } = customAttributesModified || {};

    specialPrice = specialPrice && Number(specialPrice);
    const {
        data: { quantityInputFields, trolleyProducts },
        methods: {
            handleQuantityInput,
            handleMinus,
            handlePlus,
            addToTrolleyBtn,
            handleEnterOnInput,
            removeFromCart,
        },
    } = useTrolleyUtility();

    const handleRemoveProduct = async (payload) => {
        await removeFromCart(payload, () => {
            productDeleteMessage(t);
        });
    };

    const productQuantityInTrolley = trolleyProducts?.[sku]?.quantity || "0";

    let leastPrice;
    let tierPrice;
    let message;

    if (customer) {
        tierPrice = getTierPrice(
            tierPricesArray,
            customer?.group_id,
            productQuantityInTrolley
        );
        leastPrice = getMinPrice(price, tierPrice);
    } else {
        tierPrice = getTierPrice(tierPricesArray, 0, productQuantityInTrolley);
        leastPrice = getMinPrice(price, tierPrice);
    }

    if (Number(specialPrice) >= leastPrice) {
        specialPrice = null;
    }

    if (price > leastPrice) {
        price = leastPrice;
    }

    stockLevelStatus = getStockLevel({
        stock_level: stockLevelStatus?.toString(),
        t,
        deviceWidth,
    });

    let [tierValue, tierQty] = getTierPriceAndQuantity(
        leastPrice,
        tierPricesArray,
        customer?.group_id,
        productQuantityInTrolley,
        specialPrice
    );
    if (tierValue && tierQty) {
        message = `Buy ${tierQty} or more at £${tierValue}`;
    }
    let por, porPercent;
    if (unitQuantity && rrp && price) {
        let result = getPORAndPORPercent(
            unitQuantity,
            rrp,
            Number(specialPrice) && Number(specialPrice) < price
                ? Number(specialPrice)
                : price,
            taxRate
        );
        por = result.por;
        porPercent = result.porPercent;
    }

    const offers = customOffersSplit(specialOffers);

    const nutritionalInfo = {
        energyKcal,
        energyKj,
        fat,
        saturatesInFat,
        carbohydrates,
        sugarsInCarbs,
        protein,
        fibre,
        salt,
        dietary,
    };

    const pricingInfo = {
        price,
        rrp,
        offers,
        id,
        por,
        porPercent,
        per100g,
        perPiece,
        taxRate,
        unitQuantity,
        specialPrice,
        message,
    };

    const productTrolleyInfo = useAppSelector(
        (state) => state.trolley.products[sku]
    );

    const productInfo = {
        name,
        sku,
        shortDescription,
        packSize,
        price,
        dietary,
        maxSaleQty,
    };
    const pageUrl = `${constants.websiteUrl}/${url}`;
    const getProductStockStatus = useGetProductStockStatus();
    const { isLoading: stockStatusLoading } = getProductStockStatus;

    const details = getPdpProductDetails(
        { ...pricingInfo, ...productInfo, customAttributesModified },
        { cart_improve: true }
    );

    const {
        methods: { addToWishlist, removeFromWishlist },
    } = useWishlistUtility();

    const quantityValue = quantityInputFields?.[sku]?.quantity;

    const trolleyInfo = {
        details,
        isProductFavourite,
        stockStatusLoading,
        deliveryAvailable,
        clickAndCollectAvailable,
        productTrolleyInfo,
        quantityInputFields,
        quantityValue,
        stockLevelStatus,
    };

    // function for checking livestock status

    const checkLiveStockStatus = async (wareHouseId) => {
        const payload = {
            prodData: {
                sku,
                warehouseId: !wareHouseId ? ONLINE_DELIVERY_STORE_ID : wareHouseId,
                customerId: customer?.id || "",
                storeId: STORE_ID,
            },
        };

        try {
            setTaxLoading(true);
            const response = await getProductStockStatus.mutateAsync(payload);
            setTaxLoading(false);
            const [{ taxrate, max_sale_qty, product_source }] = response;
            setMaxSaleQty(max_sale_qty);
            setTaxRate(taxrate || 0);
            setProductSource(product_source);
        } catch (err) {
            setTaxLoading(false);
            const error = parseMagentoErrorMessage(err);
            handleToastError(error.message);
        }
    };

    const addRemoveFavorite = () => {
        if (isProductFavourite) {
            removeFromWishlist([id]);
        } else {
            addToWishlist(id, { name, id, price, sku });
        }
    };

    const handleProductAvailabilitySection = async () => {
        if (!deliveryMode) {
            setClickAndCollectAvailable(true);
            setDeliveryAvailable(true);
        } else if (Number(deliveryMode) == Number(constants.onlineExclusiveId)) {
            setDeliveryAvailable(true);
            setClickAndCollectAvailable(false);
        } else if (Number(deliveryMode) == Number(constants.collectionOnlyId)) {
            setClickAndCollectAvailable(true);
            setDeliveryAvailable(false);
        }
    };

    useEffectOnce(() => {
        handleProductAvailabilitySection();
    }, []);

    useEffectOnce(() => {
        if (selectedStoreId) checkLiveStockStatus(selectedStoreId);
    }, [selectedStoreId]);

    // Algonomy Placement

    useEffectOnce(async () => {
        if (!customerLoading) {
            const cartProducts = Object.values(trolleyProducts || {}).map(
                (item) => item?.extension_attributes?.product_id
            );
            const [data, err] = await getPlacementForPDP(
                id,
                cartProducts,
                details.categoryIds
            );
            if (err) {
                handleToastError(err.message);
            } else {
                if (data) setAlgonomyPlacement(data?.placements?.[0]);
            }
        }
    }, [customer]);

    const sendG4AAnalyticsData = async (params) => {
        itemViewPdpG4AAnalytics(params);
    };

    useEffectOnce(() => {
        if (name && id && price && sku) {
            sendG4AAnalyticsData({ name, id, price, sku });
        }
    }, []);

    return {
        data: {
            name,
            id,
            price,
            sku,
            status,
            weight,
            customAttributesModified,
            metaDescription,
            metaTitle,
            productInfo,
            images,
            parsedLabels,
            pricingInfo,
            nutritionalInfo,
            trolleyInfo,
            algonomyPlacement,
            mobileInfoDietaryClickedKey,
            stockLevelStatus,
            pageUrl,
            isMobile,
            t,
            productSource,
            selectedStoreId,
            taxLoading,
        },
        methods: {
            addToTrolleyBtn,
            handleMinus,
            handlePlus,
            handleQuantityInput,
            addRemoveFavorite,
            handleEnterOnInput,
            handleDietaryInfoClick,
            setMobileInfoDietaryClickedKey,
            handleRemoveProduct,
        },
    };
};
