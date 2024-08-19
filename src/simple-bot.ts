import { getBets, getMarketBySlug } from "./api";
import { username, key, slug, randomTradeSlugs, traders } from "./constants";

const API_URL = "https://manifold.markets/api/v0";

const getRandomBetAmount = function () {
  return Math.floor(Math.random() * 5) + 1;
};

const makeBet = function(contractId: string, outcome: "YES" | "NO", amount: number){
    return {
        contractId,
        outcome,
        amount
    };
}

const generateBetOutcome = function(): "YES" | "NO" {
    const outcomeValue = Math.floor(Math.random() * 2);
    return outcomeValue === 0 ? "NO" : "YES";
}

const placeBet = function(traderKey: string, bet: {
    contractId: string;
    outcome: "YES" | "NO";
    amount: number;
  }) {
    return fetch(`${API_URL}/bet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${traderKey}`,
        },
        body: JSON.stringify(bet),
      }).then((res) => res.json());
}

const generateTraders = function(numberOfTraders: number) {
    return traders.slice(0, Math.min(numberOfTraders, traders.length));
}

const sleepFor10mins = function(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000)); // 10 minutes in milliseconds
};

const bar = async function(numberOfTraders: number) {
    const availableTraders = generateTraders(numberOfTraders);
    let betHolder = 0; // Index for trade slug

    // Use while loop to iterate over trade slugs until all have been processed
    while (betHolder < randomTradeSlugs.length) {
        const slug = randomTradeSlugs[betHolder];
        const market = await getMarketBySlug(slug);
        
        // Parallel bets for all traders using map and Promise.all
        const betsPromises = availableTraders.map((trader) => {
            const betOutcome = generateBetOutcome();
            const betAmount = getRandomBetAmount();
            
            // Return the promise for placing the bet
            return placeBet(trader.traderApiKey, makeBet(market.id, betOutcome, betAmount))
                .then(betPlaced => {
                    console.log(`Bet placed by ${trader.traderApiKey} on ${slug}. Amount: ${betPlaced.amount}, Outcome: ${betPlaced.outcome}`);
                    return betPlaced;
                })
                .catch(error => {
                    console.error(`Error placing bet for ${trader.traderApiKey}:`, error);
                });
        });
        
        // Wait for all traders to finish placing bets in parallel
        await Promise.all(betsPromises);

        // Sleep for 10 minutes before proceeding to the next slug
        console.log("Sleeping for 10 minutes...");
        await sleepFor10mins();
        console.log("10 minutes have passed!");

        // Increment betHolder to move to the next slug
        betHolder++;
    }
    
    console.log("All trades have been placed. Exiting process.");
    process.exit(1)
};

// Example usage
bar(2); // Pass the number of traders