#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Review {
    pub id: u32,
    pub author: Address,
    pub subject: Address,
    pub score: u32, // 1 to 5
    pub content: String,
    pub timestamp: u64,
    pub upvotes: u32,
    pub downvotes: u32,
}

#[contracttype]
pub enum DataKey {
    Counter,             // u32
    Review(u32),         // Review
    Vote(Address, u32),  // bool (true if voted)
    Reputation(Address), // i32
}

#[contract]
pub struct ReputeContract;

#[contractimpl]
impl ReputeContract {
    /// Adds a new review. Author must sign the transaction.
    /// Impact = score - 3, applied immediately to subject reputation.
    pub fn add_review(env: Env, author: Address, subject: Address, score: u32, content: String) -> u32 {
        author.require_auth();

        // Validate score range (1–5)
        if score < 1 || score > 5 {
            panic!("Score must be between 1 and 5");
        }

        let storage = env.storage().persistent();

        // Increment global ID counter
        let mut id: u32 = storage.get(&DataKey::Counter).unwrap_or(0);
        id += 1;
        storage.set(&DataKey::Counter, &id);

        let timestamp = env.ledger().timestamp();

        // Store review
        let review = Review {
            id,
            author: author.clone(),
            subject: subject.clone(),
            score,
            content,
            timestamp,
            upvotes: 0,
            downvotes: 0,
        };
        storage.set(&DataKey::Review(id), &review);

        // Apply initial impact to subject reputation
        // impact = score - 3  →  5:+2, 4:+1, 3:0, 2:-1, 1:-2
        let impact: i32 = (score as i32) - 3;
        let mut subject_rep: i32 = storage.get(&DataKey::Reputation(subject.clone())).unwrap_or(0);
        subject_rep += impact;
        storage.set(&DataKey::Reputation(subject), &subject_rep);

        env.events().publish((symbol_short!("rev_add"), id), author);
        id
    }

    /// Fetches a review by ID.
    pub fn get_review(env: Env, id: u32) -> Review {
        env.storage()
            .persistent()
            .get(&DataKey::Review(id))
            .unwrap_or_else(|| panic!("Review not found"))
    }

    /// Votes on a review (agree = upvote, disagree = downvote).
    ///
    /// Upvote (AGREE):
    ///   - subject_reputation += impact (validates the review direction)
    ///   - author_reputation  += 1      (reward for accurate review)
    ///
    /// Downvote (DISAGREE):
    ///   - author_reputation  -= 1      (penalise for inaccurate review)
    ///   - subject_reputation  unchanged
    pub fn vote_review(env: Env, voter: Address, id: u32, is_upvote: bool) {
        voter.require_auth();

        let storage = env.storage().persistent();

        // Prevent double voting
        let vote_key = DataKey::Vote(voter.clone(), id);
        if storage.has(&vote_key) {
            panic!("Already voted on this review");
        }

        let mut review: Review = storage
            .get(&DataKey::Review(id))
            .unwrap_or_else(|| panic!("Review not found"));

        let impact: i32 = (review.score as i32) - 3;
        let subject = review.subject.clone();
        let author = review.author.clone();

        let mut subject_rep: i32 = storage.get(&DataKey::Reputation(subject.clone())).unwrap_or(0);
        let mut author_rep: i32 = storage.get(&DataKey::Reputation(author.clone())).unwrap_or(0);

        if is_upvote {
            // Community AGREEs: reinforce impact on subject, reward author
            review.upvotes += 1;
            subject_rep += impact;
            author_rep += 1;
        } else {
            // Community DISAGREEs: penalise author only, subject unchanged
            review.downvotes += 1;
            author_rep -= 1;
        }

        storage.set(&DataKey::Review(id), &review);
        storage.set(&vote_key, &true);
        storage.set(&DataKey::Reputation(subject), &subject_rep);
        storage.set(&DataKey::Reputation(author), &author_rep);

        env.events().publish((symbol_short!("voted"), id, is_upvote), voter);
    }

    /// Returns the reputation score of an address.
    pub fn get_reputation(env: Env, address: Address) -> i32 {
        env.storage()
            .persistent()
            .get(&DataKey::Reputation(address))
            .unwrap_or(0)
    }

    /// Returns the total number of reviews.
    pub fn get_total_reviews(env: Env) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::Counter)
            .unwrap_or(0)
    }

    /// Returns all reviews for a specific subject address.
    pub fn get_reviews_by_wallet(env: Env, subject: Address) -> soroban_sdk::Vec<Review> {
        let mut results = soroban_sdk::Vec::new(&env);
        let total = Self::get_total_reviews(env.clone());
        for i in 1..=total {
            let review = Self::get_review(env.clone(), i);
            if review.subject == subject {
                results.push_back(review);
            }
        }
        results
    }

    /// Checks if a voter has already voted on a review.
    pub fn has_voted(env: Env, voter: Address, id: u32) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Vote(voter, id))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn setup() -> (soroban_sdk::Env, ReputeContractClient<'static>) {
        panic!("use inline setup in each test")
    }

    /// Review creation applies the correct initial impact to subject reputation.
    #[test]
    fn test_initial_impact_on_creation() {
        let env = Env::default();
        env.mock_all_auths();
        let cid = env.register_contract(None, ReputeContract);
        let client = ReputeContractClient::new(&env, &cid);

        let author = Address::generate(&env);
        let subject_a = Address::generate(&env);
        let subject_b = Address::generate(&env);
        let subject_c = Address::generate(&env);

        // score 5 → impact +2
        client.add_review(&author, &subject_a, &5, &String::from_str(&env, "Great work"));
        assert_eq!(client.get_reputation(&subject_a), 2);

        // score 3 → impact 0
        client.add_review(&author, &subject_b, &3, &String::from_str(&env, "Average"));
        assert_eq!(client.get_reputation(&subject_b), 0);

        // score 1 → impact -2
        client.add_review(&author, &subject_c, &1, &String::from_str(&env, "Poor"));
        assert_eq!(client.get_reputation(&subject_c), -2);
    }

    /// Upvote: subject gets +impact again, author gets +1.
    #[test]
    fn test_upvote_community_agree() {
        let env = Env::default();
        env.mock_all_auths();
        let cid = env.register_contract(None, ReputeContract);
        let client = ReputeContractClient::new(&env, &cid);

        let author = Address::generate(&env);
        let subject = Address::generate(&env);
        let voter = Address::generate(&env);

        // Score 4 → initial impact = +1, subject_rep = 1
        let id = client.add_review(&author, &subject, &4, &String::from_str(&env, "Good developer"));
        assert_eq!(client.get_reputation(&subject), 1);
        assert_eq!(client.get_reputation(&author), 0);

        // Upvote → subject_rep += 1 = 2, author_rep += 1 = 1
        client.vote_review(&voter, &id, &true);
        assert_eq!(client.get_reputation(&subject), 2);
        assert_eq!(client.get_reputation(&author), 1);

        let review = client.get_review(&id);
        assert_eq!(review.upvotes, 1);
        assert_eq!(review.downvotes, 0);
    }

    /// Downvote: only author loses -1, subject unchanged.
    #[test]
    fn test_downvote_penalises_author_only() {
        let env = Env::default();
        env.mock_all_auths();
        let cid = env.register_contract(None, ReputeContract);
        let client = ReputeContractClient::new(&env, &cid);

        let author = Address::generate(&env);
        let subject = Address::generate(&env);
        let voter = Address::generate(&env);

        // Score 5 → initial impact = +2, subject_rep = 2
        let id = client.add_review(&author, &subject, &5, &String::from_str(&env, "Perfect"));
        assert_eq!(client.get_reputation(&subject), 2);

        // Downvote → subject_rep stays 2, author_rep = -1
        client.vote_review(&voter, &id, &false);
        assert_eq!(client.get_reputation(&subject), 2);
        assert_eq!(client.get_reputation(&author), -1);

        let review = client.get_review(&id);
        assert_eq!(review.downvotes, 1);
        assert_eq!(review.upvotes, 0);
    }

    /// Double voting should panic.
    #[test]
    #[should_panic(expected = "Already voted on this review")]
    fn test_prevent_double_voting() {
        let env = Env::default();
        env.mock_all_auths();
        let cid = env.register_contract(None, ReputeContract);
        let client = ReputeContractClient::new(&env, &cid);

        let author = Address::generate(&env);
        let subject = Address::generate(&env);
        let voter = Address::generate(&env);

        let id = client.add_review(&author, &subject, &3, &String::from_str(&env, "Ok"));
        client.vote_review(&voter, &id, &true);
        client.vote_review(&voter, &id, &true); // should panic
    }

    /// Score out of range (0 or 6) must panic.
    #[test]
    #[should_panic(expected = "Score must be between 1 and 5")]
    fn test_invalid_score_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let cid = env.register_contract(None, ReputeContract);
        let client = ReputeContractClient::new(&env, &cid);

        let author = Address::generate(&env);
        let subject = Address::generate(&env);
        client.add_review(&author, &subject, &6, &String::from_str(&env, "Invalid"));
    }
}
