# NZ RC25.7.41 Guide / Timeline parity audit

- Guide legacy category renderers were displaying Booking-owned and legacy seed fields that the Guide Studio did not own.
- Guide body is now constrained to Guide/Place-owned content: Address, Phone, Website, Hours where semantically meaningful, Description, Useful info.
- Stay check-in/check-out seed values are not exposed as Place Hours. Booking remains the owner of reservation facts.
- Timeline continues to own schedule fields and resolve navigation through shared Place authority; no third address snapshot was introduced.
- Booking remains accessible from Guide as contextual navigation, without duplicating Booking facts into the Guide body.
