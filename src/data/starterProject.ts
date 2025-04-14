import ProjectFile from "../models/ProjectFile.model";

export const starterProject:Array<ProjectFile> = [
    // new ProjectFile("README.md", "", "# Welcome to your new project!"),
    new ProjectFile("contract.cpp", "", `#include <eosio/eosio.hpp>
using namespace eosio;

CONTRACT mycontract : public contract {
   public:
      using contract::contract;

      // This is a database model definition
      TABLE user {
         name     vaulta_account;
         uint8_t  is_admin;

         uint64_t primary_key() const { 
            return vaulta_account.value; 
         }
      };

      // This is a table constructor which we will instantiate later
      using user_table = multi_index<"users"_n, user>;

      // Every ACTION you define can be called from outside the blockchain
      ACTION newuser( name vaulta_account ){
         // Only the account calling this can add themselves
         require_auth(vaulta_account);

         // We're instantiating the user table
         user_table users(get_self(), get_self().value);

         // Finally, we're putting that user into the database
         users.emplace(get_self(), [&](auto& row) {
            row = user {
               .vaulta_account = vaulta_account,
               .is_admin = 0
            };
         });
      }
};`),
    new ProjectFile("contract.hpp", "include/", `#include <eosio/eosio.hpp>`),
    new ProjectFile(".gitkeep", "include/", ``),
];
