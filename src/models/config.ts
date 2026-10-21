

import { config } from '../config';

module.exports = (sequelize: any, DataTypes: any) => {
  const Config = sequelize.define(
    "Config",
    {
      config_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      logo_light: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get(this: any): string {       
          const raw_url: string = this.getDataValue("logo_light");
          return raw_url ? config.clientUrl + raw_url : "";
        },
      },
      logo_dark: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get(this: any): string {       
          const raw_url: string = this.getDataValue("logo_dark");
          return raw_url ? config.clientUrl + raw_url : "";
        },
      },
      app_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_email: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_text: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_primary_color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_secondary_color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_ios_link: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_android_link: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      app_tell_a_friend_text: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      stripe_secret: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      stripe_public: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      paypal_secret: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      paypal_public: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      email_service: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      email_host: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      email_port: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },

      email_username: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      email_password: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      twilio_account_sid: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      twilio_auth_token: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      twilio_phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      msg91_api_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      msg91_sender_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      msg91_sms_template_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      allow_login_by_email: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },

      allow_login_by_mobile: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },

      allow_login_by_google: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },

      allow_login_by_apple: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },

      purchase_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      email: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get(this: any): string {       
          const data = this.getDataValue("password");
          if (!data) return "";
          return "*".repeat(data.length);
        },
      },
      email_title: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      copyright_text: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      email_banner: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
        get(this: any): string {       
          const raw_urls = this.getDataValue("email_banner");
          const imageUrls = `${process.env.baseUrl}${raw_urls}`;
          return imageUrls != process.env.baseUrl ? imageUrls : ``;
        },
      },

      one_signal_app_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      one_signal_app_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      privacy_policy: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      terms_and_conditions: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      order :{
        type:DataTypes.INTEGER,
        allowNull:true,
        defaultValue:0,
      },
      razor_public_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

      razor_secret_key: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },

    },
    {
      tableName: "config",
      timestamps: true,
    }
  );
  return Config;
}


