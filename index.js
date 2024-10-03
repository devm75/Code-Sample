import routes from "@/constants/routes";
import { generateJsonLdProdDetail } from "@/utils/schema";
import Head from "next/head";
import Link from "next/link";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Breadcrumb from "reactstrap/lib/Breadcrumb";
import BreadcrumbItem from "reactstrap/lib/BreadcrumbItem";
import AlgonomySection from "../AlgonomySection";
import Loader from "../Loader";
import SeoMeta from "../SEO";
import AddProduct from "./DesktopAndMobileProductDetails/ProductData";
import ProductDescription from "./DesktopAndMobileProductDetails/ProductDescription";
import ProductGallery from "./DesktopAndMobileProductDetails/ProductGallery";
import ProductInfo from "./DesktopAndMobileProductDetails/ProductInfo";
import { useProductDetailsController } from "./useProductDetailsController";

function PdpView(props) {
    const { data, methods } = useProductDetailsController(props);
    const Seo = {
        canonicalUrl:
            data?.customAttributesModified?.canonical_link || data?.pageUrl || "",
        nofollow: false,
        noindex: false,
    };

    const type = "Product";
    const prodName = data?.images[0]?.label;
    const prodImage = data?.images[0]?.file;
    const prodDescription = data?.metaDescription;

    const jsonLdProdDetail = generateJsonLdProdDetail({
        type,
        prodName,
        prodDescription,
        prodImage,
    });

    return (
        <>
            <Head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProdDetail) }}
                />{" "}
            </Head>

            {data?.taxLoading && <Loader />}
            <SeoMeta
                seo={Seo}
                pageTitle={data.metaTitle}
                pageDescription={data.metaDescription}
            />
            <div className="pdp-wrapper" id="view-item-g4A">
                <div>
                    <Breadcrumb listTag="div" tag="nav" className="mb-lg-4">
                        <Link
                            prefetch={false}
                            href={routes.Home}
                            className="breadcrumb-item"
                        >
                            Home
                        </Link>
                        <BreadcrumbItem active>{data?.name}</BreadcrumbItem>
                    </Breadcrumb>
                </div>
                <Container fluid className="p-0">
                    <Row>
                        <Col xs={12} lg={4}>
                            <ProductGallery
                                productImages={data.images}
                                labelImages={data?.parsedLabels}
                            />
                        </Col>
                        <Col xs={12} lg={8} className="position-relative ps-xl-4">
                            <ProductInfo
                                data={data.productInfo}
                                handleDietaryInfoClick={methods.handleDietaryInfoClick}
                            />
                            <AddProduct
                                data={{
                                    ...data.pricingInfo,
                                    ...data.productInfo,
                                    ...data.trolleyInfo,
                                    isMobile: data.isMobile,
                                    t: data?.t,
                                    productSource: data.productSource,
                                    selectedStoreId: data.selectedStoreId,
                                }}
                                methods={methods}
                            />
                        </Col>
                        <Col xs={12} md={12}>
                            <ProductDescription
                                data={data.customAttributesModified}
                                nutritionalInfo={data.nutritionalInfo}
                                mobileInfoDietaryClickedKey={data.mobileInfoDietaryClickedKey}
                                setMobileInfoDietaryClickedKey={
                                    methods.setMobileInfoDietaryClickedKey
                                }
                            />
                        </Col>
                    </Row>
                </Container>
            </div>
            <div className="mb-4">
                <AlgonomySection
                    title="Bestsellers"
                    placement={data.algonomyPlacement}
                    cart_improve={true}
                    allowDelete={true}
                />
            </div>
        </>
    );
}

export default PdpView;
