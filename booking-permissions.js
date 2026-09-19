/* booking-permissions.js — Travel Engine 25.2.8 selectable Booking permission mode. */
(function(root){
  'use strict';
  function config(){return (root.TRIP_CONFIG&&root.TRIP_CONFIG.bookingManagement)||{};}
  function mode(){return String(config().mode||'admin').toLowerCase()==='collaborative'?'collaborative':'admin';}
  function completed(){return !!(root.isTripCompleted&&root.isTripCompleted());}
  function currentLegacyIdentity(){try{return typeof root.getFriend==='function'?String(root.getFriend()||''):'';}catch(_){return '';}}
  function currentPartyId(){
    const legacy=currentLegacyIdentity();
    const parties=(root.TRIP_CONFIG&&root.TRIP_CONFIG.parties&&root.TRIP_CONFIG.parties.identities)||{};
    for(const id of Object.keys(parties)){
      const party=parties[id]||{};
      if(id===legacy)return id;
      if(Array.isArray(party.legacyAliases)&&party.legacyAliases.includes(legacy))return id;
    }
    const participants=(root.TRIP_CONFIG&&root.TRIP_CONFIG.participants&&root.TRIP_CONFIG.participants.identities)||{};
    if(participants[legacy]){
      const match=Object.keys(parties).find(id=>{
        const aliases=parties[id]&&parties[id].legacyAliases;
        return Array.isArray(aliases)&&aliases.includes(legacy);
      });
      if(match)return match;
    }
    return legacy?`party-${legacy}`:'';
  }
  function isKnownParty(){
    const id=currentPartyId();
    const parties=(root.TRIP_CONFIG&&root.TRIP_CONFIG.parties&&root.TRIP_CONFIG.parties.identities)||{};
    return !!(id&&parties[id]);
  }
  function canEdit(){
    if(completed())return false;
    if(mode()==='collaborative')return isKnownParty();
    return !!(root.isAdminMode&&root.isAdminMode());
  }
  function editLabel(){return mode()==='collaborative'?'Edit Booking':'Edit Booking';}
  function denialMessage(){
    if(completed())return 'This trip is completed. Reopen the trip before editing bookings.';
    return mode()==='collaborative'?'Choose your traveller identity before editing bookings.':'Open Trip Studio before editing bookings.';
  }
  function describe(){return Object.freeze({mode:mode(),canEdit:canEdit(),partyId:currentPartyId(),collaborative:mode()==='collaborative'});}
  root.BOOKING_PERMISSIONS=Object.freeze({mode,canEdit,currentPartyId,isKnownParty,editLabel,denialMessage,describe});
  document.addEventListener('travelengine:adminmodechange',()=>root.dispatchEvent(new CustomEvent('travelengine:bookingpermissionchange')));
  root.addEventListener('travelengine:tripcompleted',()=>root.dispatchEvent(new CustomEvent('travelengine:bookingpermissionchange')));
  root.addEventListener('travelengine:tripreopened',()=>root.dispatchEvent(new CustomEvent('travelengine:bookingpermissionchange')));
})(globalThis);
