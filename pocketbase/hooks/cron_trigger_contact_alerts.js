cronAdd("contact_alerts_daily", "0 8 * * *", () => {
    let alertDays = 30;
    try {
        const settings = $app.findFirstRecordByFilter("company_settings", "id != ''");
        if (settings && settings.getInt("contact_alert_days") > 0) {
            alertDays = settings.getInt("contact_alert_days");
        }
    } catch(err) {}

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - alertDays);
    const thresholdStr = thresholdDate.toISOString().replace('T', ' ').substring(0, 19) + 'Z';

    const contacts = $app.findRecordsByFilter("contacts", "is_favorite = true", "-created", 1000, 0);
    const admins = $app.findRecordsByFilter("users", "role = 'Administrador' || role = 'Gerente de Projeto'", "", 1000, 0);

    for (let contact of contacts) {
        let lastInteractionDate = contact.getString("created");
        try {
            const lastInteraction = $app.findFirstRecordByFilter("contact_interactions", "contact = {:contact}", "-interaction_date", {:contact: contact.id});
            if (lastInteraction.getString("interaction_date")) {
                lastInteractionDate = lastInteraction.getString("interaction_date");
            } else {
                lastInteractionDate = lastInteraction.getString("created");
            }
        } catch(err) {}

        if (lastInteractionDate < thresholdStr) {
            for (let admin of admins) {
                let alreadyHasUnread = false;
                try {
                    $app.findFirstRecordByFilter("notifications", "user = {:user} && action_payload = {:payload} && action_type = 'contact_alert' && read = false", "", {
                        user: admin.id,
                        payload: contact.id
                    });
                    alreadyHasUnread = true;
                } catch(err) {}

                if (alreadyHasUnread) continue;

                const notif = new Record($app.findCollectionByNameOrId("notifications"));
                notif.set("user", admin.id);
                notif.set("title", "Alerta de Retorno: " + contact.getString("name"));
                notif.set("message", `O contato favorito ${contact.getString("name")} não possui interações há mais de ${alertDays} dias. Retome o contato.`);
                notif.set("link", "/contacts"); 
                notif.set("is_important", true);
                notif.set("action_type", "contact_alert");
                notif.set("action_payload", contact.id);
                $app.save(notif);
            }
        } else {
            try {
                const unreadAlerts = $app.findRecordsByFilter("notifications", "action_payload = {:payload} && action_type = 'contact_alert' && read = false", "", 1000, 0, { payload: contact.id });
                for (let alert of unreadAlerts) {
                    alert.set("read", true);
                    $app.save(alert);
                }
            } catch(err) {}
        }
    }
})
