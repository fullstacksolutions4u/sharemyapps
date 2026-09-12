class FreeOfferDto {
  static validateAdminUpdate(data) {
    const { status, offerDueDate, adminNote } = data;
    return { status, offerDueDate, adminNote };
  }
}

module.exports = FreeOfferDto;
