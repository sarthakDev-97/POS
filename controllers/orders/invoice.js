const asyncWrapper = require("../../middlewares/async");
const { StatusCodes } = require("http-status-codes");
const invoiceModel = require("../../models/orders/invoice");

const getAllInvoices = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const invoices = await invoiceModel.find({ order: id });
  if (!invoices) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "No invoices found for this order." });
  }
  res
    .code(StatusCodes.OK)
    .send({ invoices, msg: "Invoices retrieved successfully." });
});

const getInvoiceById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const invoice = await invoiceModel
    .findById(id)
    .populate({
      path: "products.product",
      select: "name variation sku category unit",
      populate: [
        { path: "category", select: "name code" },
        { path: "variation", select: "type value" },
        { path: "unit", select: "shortName" },
        { path: "tax", select: "rate" },
      ],
    })
    .populate("user", "name phone gstNumber")
    .populate("address");
  if (!invoice) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Invoice not found. Please check again." });
  }

  const totalItems = invoice.products.reduce(
    (acc, item) => acc + item.quantity,
    0
  );
  res.header("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">

<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=1224">
        <title>Invoice</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <meta http-equiv="cache-control" content="max-age=604800, public">
        <style>
                * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                }
        </style>
</head>

<body class=" w-svw overflow-x-hidden scale-25 md:scale-100">
        <div class="w-full h-fit px-16 py-10 border border-black flex justify-center flex-col gap-10">
                <!-- heading -->
                <h1 class="text-5xl font-bold text-center">Tax Invoice</h1>
                <!-- details of invoice -->
                <div class="flex justify-between w-full gap-12">
                        <div class="w-1/2 h-auto flex flex-col gap-4">
                                <div class="flex flex-col justify-center items-center text-3xl font-semibold w-full">
                                        <div class="flex justify-between w-full">
                                                <div>Invoice No.</div>
                                                <div id="invoiceNo">${
                                                  invoice?.invoiceNumber
                                                }</div>
                                        </div>
                                        <div class="flex justify-between w-full bg-cyan-700 text-white px-2 py-1">
                                                <div>Current Due</div>
                                                <div id="due">₹ ${Math.round(
                                                  invoice.totalPayable +
                                                    invoice.packagingCharges
                                                      .amount *
                                                      invoice.packagingCharges
                                                        .quantity +
                                                    ((invoice.packagingCharges
                                                      .amount *
                                                      5) /
                                                      100) *
                                                      invoice.packagingCharges
                                                        .quantity
                                                ).toFixed(2)}</div>
                                        </div>
                                        <div class="flex justify-between w-full ">
                                                <div>Date</div>
                                                <div id="date">${
                                                  invoice.date.getDate() +
                                                  "/" +
                                                  (invoice.date.getMonth() +
                                                    1) +
                                                  "/" +
                                                  invoice.date.getFullYear()
                                                }</div>
                                        </div>
                                </div>
                                <div class="text-xl">
                                        <b>${
                                          invoice.user?.name || "Demo user"
                                        }</b>
                                        <br>
                                        <div id="customerName">${
                                          invoice.address?.name || "Demo user"
                                        },
                                                <div class="w-72" id="customerAddress">
                                                        ${
                                                          invoice.address
                                                            ?.street
                                                        }, ${
    invoice.address?.city
  }, ${invoice.address?.state}, ${invoice.address?.country || "India"}, ${
    invoice.address?.pincode
  }
                                                </div>
                                                <b>Mobile:</b> <span id="customerPhone">${
                                                  invoice.user?.phone
                                                }</span>
                                                <br>
                                                <b>
                                                        GSTIN:
                                                </b>
                                                <span id="customerGST">${
                                                  invoice.user?.gstNumber
                                                }</span>
                                        </div>
                                </div>
                        </div>
                        <div class="w-1/2 h-auto flex flex-col gap-4 text-xl">
                                <img src="https://pos-gxtx.onrender.com/api/v1/uploads/logo.png" alt="img here"
                                        class="w-56 mx-auto h-auto" />
                                <div class="text-left" id="soldBy">K Market</div>
                                <div class="text-left" id="senderAddress">Plot No. - 08, Chamunda Industrial, BIH Gujarat Truck,
                                        Udhna, Surat, Gujarat, 394210, India
                                        <br>
                                        <b>Mobile:</b> <span id="sellerPhone">9601409696</span>
                                        <br>
                                        <b>
                                                GSTIN:
                                        </b>
                                        <span id="sellerGST">24AAYFK8412EIZ4</span>
                                </div>
                        </div>
                </div>
                <div class="overflow-x-auto w-full">
                        <table class="min-w-full divide-y-2 divide-gray-200 bg-white text-md">
                                <thead class="ltr:text-left rtl:text-right">
                                        <tr class="bg-cyan-700 text-white text-right">
                                                <th class="whitespace-nowrap px-4 py-2 font-medium ">#</th>
                                                <th class="whitespace-nowrap px-4 py-2 font-medium text-left">Product</th>
                                                <th class="whitespace-nowrap px-4 py-2 font-medium ">HSN</th>
                                                <th class="whitespace-nowrap px-4 py-2 font-medium ">Quantity</th>
                                                <th class="whitespace-nowrap px-4 py-2 font-medium ">Fold (${
                                                  invoice?.products[0].folds
                                                })</th>
                                                <th class="whitespace-nowrap px-4 py-2 font-medium ">Unit Price <br>(₹)</th>
                                                <th class="whitespace-nowrap px-4 py-2 font-medium ">Taxable Value <br>(₹)</th>
                                                <th class="whitespace-nowrap px-4 py-2 font-medium ">CGST <br>(₹)</th>
                                                <th class="whitespace-nowrap px-4 py-2 font-medium ">SGST <br>(₹)</th>
                                                <th class="whitespace-nowrap px-4 py-2 font-medium ">IGST <br>(₹)</th>
                                                <th class="whitespace-nowrap px-4 py-2 font-medium ">Subtotal <br>(₹)</th>
                                        </tr>
                                </thead>

                                <tbody class="divide-y divide-gray-200" id="tableBody">
                                        ${invoice.products.map((elem, ind) => {
                                          return `<tr class="odd:bg-gray-50">
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center">
                                              ${ind + 1}
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-wrap">
                                              ${
                                                elem.product?.name +
                                                " " +
                                                elem.product?.variation.type +
                                                " " +
                                                elem.product?.variation.value
                                              },
                                              ${elem.product?.sku}
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center">
                                              ${elem.product?.category?.code}
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center">
                                              ${
                                                elem.quantity.toFixed(2) +
                                                "<br />" +
                                                elem.product.unit?.shortName
                                              }
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center">
                                              ${elem.foldMtrs.toFixed(2)}
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-right">
                                              ${elem.purchasedUnitPrice.toFixed(
                                                2
                                              )}
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-right">
                                              ${(
                                                elem.purchasedUnitPrice.toFixed(
                                                  2
                                                ) * elem.quantity.toFixed(2)
                                              ).toFixed(2)}
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-right">${
                                              invoice.isLocal
                                                ? (elem.totalTaxes / 2).toFixed(
                                                    2
                                                  ) +
                                                  `<br/> <span class='text-sm text-gray-600'>${
                                                    elem.product.tax?.rate / 2
                                                  }%</span>`
                                                : ""
                                            }</td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-right">${
                                              invoice.isLocal
                                                ? (elem.totalTaxes / 2).toFixed(
                                                    2
                                                  ) +
                                                  `<br/> <span class='text-sm text-gray-600'>${
                                                    elem.product.tax?.rate / 2
                                                  }%</span>`
                                                : ""
                                            }</td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-right">
                                              ${
                                                !invoice.isLocal
                                                  ? elem.totalTaxes.toFixed(2) +
                                                    `<br/> <span class='text-sm text-gray-600'>${elem.product.tax?.rate}%</span>`
                                                  : ""
                                              }
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-right">
                                                ${(
                                                  elem.totalTaxes +
                                                  elem.purchasedUnitPrice *
                                                    elem.quantity
                                                ).toFixed(2)}
                                            </td>
                                          </tr>`;
                                        })}
                                        ${
                                          invoice.packagingCharges.amount > 0
                                            ? `
                                        <tr class="odd:bg-gray-50">
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center">
                                              ${
                                                invoice.products.length + 1
                                              }</td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-wrap">
                                              Packaging Charge - ${
                                                invoice.packagingCharges.name
                                              }</td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center">
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center">
                                                ${
                                                  invoice.packagingCharges
                                                    .quantity
                                                } Nos.
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-center">
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-right">
                                                ${invoice.packagingCharges.amount.toFixed(
                                                  2
                                                )}
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-right">
                                                ${(
                                                  invoice.packagingCharges
                                                    .amount *
                                                  invoice.packagingCharges
                                                    .quantity
                                                ).toFixed(2)}
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-right">
                                              ${
                                                !invoice.isLocal
                                                  ? ""
                                                  : (
                                                      (((invoice
                                                        .packagingCharges
                                                        .amount *
                                                        5) /
                                                        100) *
                                                        invoice.packagingCharges
                                                          .quantity) /
                                                      2
                                                    ).toFixed(2) +
                                                    "<br/> <span class='text-sm text-gray-600'>2.5%</span>"
                                              }
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-right">
                                            ${
                                              !invoice.isLocal
                                                ? ""
                                                : (
                                                    (((invoice.packagingCharges
                                                      .amount *
                                                      5) /
                                                      100) *
                                                      invoice.packagingCharges
                                                        .quantity) /
                                                    2
                                                  ).toFixed(2) +
                                                  "<br/> <span class='text-sm text-gray-600'>2.5%</span>"
                                            }
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-right">
                                            ${
                                              invoice.isLocal
                                                ? ""
                                                : (
                                                    ((invoice.packagingCharges
                                                      .amount *
                                                      5) /
                                                      100) *
                                                    invoice.packagingCharges
                                                      .quantity
                                                  ).toFixed(2) +
                                                  "<br/> <span class='text-sm text-gray-600'>5%</span>"
                                            }
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900 text-right">
                                            ${(
                                              invoice.packagingCharges.amount *
                                                invoice.packagingCharges
                                                  .quantity +
                                              ((invoice.packagingCharges
                                                .amount *
                                                5) /
                                                100) *
                                                invoice.packagingCharges
                                                  .quantity
                                            ).toFixed(2)}
                                            </td>
                                            </tr>
                                        `
                                            : ""
                                        }
                                </tbody>
                                <tfoot>
                                        <tr class="bg-cyan-700 text-white text-right font-bold">
                                                <td colspan="6" class="whitespace-nowrap px-4 py-2 font-bold ">Total</td>
                                                <td class="whitespace-nowrap px-4 py-2 text-right">${(
                                                  invoice.totalPayable -
                                                  invoice.totalTaxes +
                                                  invoice.packagingCharges
                                                    .amount *
                                                    invoice.packagingCharges
                                                      .quantity
                                                ).toFixed(2)}</td>
                                                <td class="whitespace-nowrap px-4 py-2 text-right">${
                                                  !invoice.isLocal
                                                    ? (0).toFixed(2)
                                                    : (
                                                        (invoice.totalTaxes +
                                                          ((invoice
                                                            .packagingCharges
                                                            .amount *
                                                            5) /
                                                            100) *
                                                            invoice
                                                              .packagingCharges
                                                              .quantity) /
                                                        2
                                                      ).toFixed(2)
                                                }</td>
                                                <td class="whitespace-nowrap px-4 py-2 text-right">${
                                                  !invoice.isLocal
                                                    ? (0).toFixed(2)
                                                    : (
                                                        (invoice.totalTaxes +
                                                          ((invoice
                                                            .packagingCharges
                                                            .amount *
                                                            5) /
                                                            100) *
                                                            invoice
                                                              .packagingCharges
                                                              .quantity) /
                                                        2
                                                      ).toFixed(2)
                                                }</td>
                                                <td class="whitespace-nowrap px-4 py-2 text-right">${
                                                  invoice.isLocal
                                                    ? (0).toFixed(2)
                                                    : (
                                                        invoice.totalTaxes +
                                                        ((invoice
                                                          .packagingCharges
                                                          .amount *
                                                          5) /
                                                          100) *
                                                          invoice
                                                            .packagingCharges
                                                            .quantity
                                                      ).toFixed(2)
                                                }</td>
                                                <td class="whitespace-nowrap px-4 py-2 text-right">${(
                                                  invoice.totalPayable +
                                                  invoice.packagingCharges
                                                    .amount *
                                                    invoice.packagingCharges
                                                      .quantity +
                                                  ((invoice.packagingCharges
                                                    .amount *
                                                    5) /
                                                    100) *
                                                    invoice.packagingCharges
                                                      .quantity
                                                ).toFixed(2)}</td>
                                        </tr>
                                </tfoot>
                        </table>
                </div>
                <!-- calculations -->
                <div class="w-full flex justify-between gap-12">
                        <div class="w-1/2 font-bold">Authorized Signatory</div>
                        <div class="w-1/2 flex flex-col gap-2 text-xl font-semibold">
                                <div class="flex justify-between w-full">
                                        <div>Total Items:</div>
                                        <div id="items">${
                                          invoice.products.length +
                                          parseInt(
                                            `${
                                              invoice.packagingCharges.amount >
                                              0
                                                ? 1
                                                : 0
                                            }`
                                          )
                                        }</div>
                                </div>
                                <div class="flex justify-between w-full">
                                        <div>Subtotal: </div>
                                        <div id="due">₹ ${(
                                          invoice.totalPayable +
                                          invoice.packagingCharges.amount *
                                            invoice.packagingCharges.quantity +
                                          ((invoice.packagingCharges.amount *
                                            5) /
                                            100) *
                                            invoice.packagingCharges.quantity
                                        ).toFixed(2)}</div>
                                </div>
                                <div class="flex justify-between w-full ">
                                        <div>Round Off:</div>
                                        <div id="round">(+) ₹ ${(
                                          Math.round(
                                            invoice.totalPayable +
                                              invoice.packagingCharges.amount *
                                                invoice.packagingCharges
                                                  .quantity +
                                              ((invoice.packagingCharges
                                                .amount *
                                                5) /
                                                100) *
                                                invoice.packagingCharges
                                                  .quantity
                                          ) -
                                          (
                                            invoice.totalPayable +
                                            invoice.packagingCharges.amount *
                                              invoice.packagingCharges
                                                .quantity +
                                            ((invoice.packagingCharges.amount *
                                              5) /
                                              100) *
                                              invoice.packagingCharges.quantity
                                          ).toFixed(2)
                                        ).toFixed(2)}</div>
                                </div>
                                <div class="flex justify-between w-full text-3xl font-semibold px-4 py-2 bg-cyan-700 text-white">
                                        <div>Total:</div>
                                        <div id="total">₹ ${Math.round(
                                          invoice.totalPayable +
                                            invoice.packagingCharges.amount *
                                              invoice.packagingCharges
                                                .quantity +
                                            ((invoice.packagingCharges.amount *
                                              5) /
                                              100) *
                                              invoice.packagingCharges.quantity
                                        ).toFixed(2)}</div>
                                </div>
                        </div>
                </div>
                <!-- Bank Part -->
                <div class="font-semibold text-xl text-start">Bank Account Information:
                        <br>
                        <br>
                        <div class="border-2 border-gray-700 w-full h-fit px-8 py-4 font-mono font-medium">
                                Bank Name: <span id="bankName">ICICI Bank, Adajan Branch, Surat</span>
                                <br> Account Holder's Name: <span id="bankName">K Market</span>
                                <br>
                                Account Number: <span id="accountNumber">1234567890</span>
                                <br>
                                IFSC Code: <span id="ifscCode">KMCB1234567</span>
                        </div>
                </div>
                <!-- T&C Part -->
                <div class="font-semibold text-xl text-start">Terms and Conditions:
                        <br>
                        <div class="w-full h-fit font-normal text-justify">
                                (l) The product carries only manufacturer's quality assurance and no return or exchange will be
                                entertained by us. If
                                any
                                quality issue should be raised on same day at receipt Of the Goods. (2) Payment shall be due payable as
                                per above terms
                                from 15 Days of invoice issue date. If payment is delayed by more than agreed terms herewith delay
                                payment charges -
                                surcharge will be levied at the rate of 18% per annum on such delay days. (3) We make efforts to ship
                                the products here
                                under in accordance with the request delivery date however we do not have any liability of losses or
                                general or special
                                or
                                consequential damages arising out of such delay on delivery. (4) In addition to above terms, Invoice
                                shall be subject to
                                terms
                                and conditions Of the Memorandum Of understanding or business agreement pursuant to the supply, if any
                                between us and
                                customer. (5) Payment shall be made bill to bill by either Alc payee cheque or online mode like
                                NEFT/IMPS/RTGS. (6)
                                Credit
                                Terms as per discretion of management of K-Market. (7) Subject to Surat, Gujarat, India Jurisdiction.
                        </div>
                </div>
        </div>
        <script>
                window.addEventListener("load", () => {
                        // window.width = 1024;
                        // window.print();
                });
        </script>
</body>

</html>`);
});

const createInvoice = asyncWrapper(async (req, res) => {});

const updateInvoice = asyncWrapper(async (req, res) => {
  if (req.user.typeofuser === "user") {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Unauthorized access. Please login again." });
  }
  const { id } = req.params;
  const invoice = await invoiceModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  if (!invoice) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Invoice not found. Please check again." });
  }
  res
    .code(StatusCodes.OK)
    .send({ invoice, msg: "Invoice updated successfully." });
});

const getInvoiceDataById = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const invoice = await invoiceModel.findById(id).lean();
  if (!invoice) {
    return res
      .code(StatusCodes.PARTIAL_CONTENT)
      .send({ msg: "Invoice not found. Please check again." });
  }
  return res.code(StatusCodes.OK).send({ invoice });
});

const deleteInvoice = asyncWrapper(async (req, res) => {});

module.exports = {
  getInvoiceDataById,
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
