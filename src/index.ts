import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import { Contact } from "./entity/Contact";

const app = express();
app.use(express.json());

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");

    app.post("/identify", async (req, res) => {
      const { email, phoneNumber } = req.body;

      if (!email && !phoneNumber) {
        return res.status(400).json({ error: "email or phoneNumber required" });
      }

      const contacts = await AppDataSource.getRepository(Contact)
        .createQueryBuilder("contact")
        .where("contact.email = :email OR contact.phoneNumber = :phoneNumber", {
          email,
          phoneNumber,
        })
        .getMany();

      if (contacts.length === 0) {
        const newContact = new Contact();
        newContact.email = email;
        newContact.phoneNumber = phoneNumber;
        newContact.linkPrecedence = "primary";
        await AppDataSource.manager.save(newContact);

        return res.json({
          contact: {
            primaryContactId: newContact.id,
            emails: [newContact.email],
            phoneNumbers: [newContact.phoneNumber],
            secondaryContactIds: [],
          },
        });
      }

      let primaryContact = contacts.find((contact) => contact.linkPrecedence === "primary") || contacts[0];


      const response = {
        primaryContactId: primaryContact.id,
        emails: Array.from(
          new Set(contacts.map((contact) => contact.email).filter((e) => e)) //filter for removing falsy values
        ),
        phoneNumbers: Array.from(
          new Set(
            contacts.map((contact) => contact.phoneNumber).filter((p) => p)
          )
        ),
        secondaryContactIds: contacts
          .filter((contact) => contact.linkPrecedence === "secondary")
          .map((contact) => contact.id),
      };

      if ((email && !response.emails.includes(email)) ||(phoneNumber && !response.phoneNumbers.includes(phoneNumber))) {
        const newSecondaryContact = new Contact();
        newSecondaryContact.email = email;
        newSecondaryContact.phoneNumber = phoneNumber;
        newSecondaryContact.linkedId = primaryContact.id;
        newSecondaryContact.linkPrecedence = "secondary";
        await AppDataSource.manager.save(newSecondaryContact);

        response.secondaryContactIds.push(newSecondaryContact.id);
        if (email) response.emails.push(email);
        if (phoneNumber) response.phoneNumbers.push(phoneNumber);
      }

      return res.json({ contact: response });
    });

    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
  });
