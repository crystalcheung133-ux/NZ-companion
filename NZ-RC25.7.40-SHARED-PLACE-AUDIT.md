# NZ RC25.7.40 Shared Place Audit

Architecture audit conclusion: safe to introduce a thin Place override authority without changing deploy-master IDs. Booking remains reservation authority; Guide remains descriptive content; Timeline remains authored schedule. Shared place facts are address, phone, website and navigation. Booking and Guide editors write the same Place record. Timeline navigation resolves the Place record at render time, so it does not store a third address/map snapshot for linked places. Existing deploy-master place data remains fallback and is not deleted.

Guide Studio is deliberately small: Place name, Address, Phone, Website, Hours, Description, Useful info. Booking remains the convenient second editing entry for Address/Phone/Website. Reservation-specific facts stay in Booking Notes.

Browser release gate audit: Documents browser tests were incorrectly dependent on live third-party FX endpoints. RC25.7.40 stubs both configured FX providers inside that browser context only; production FX behavior is unchanged.
